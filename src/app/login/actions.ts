'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { SUPABASE_MASTER_PASSWORD } from '@/lib/server-config';


/**
 * Helper function to invoke a Supabase Edge Function.
 * This should be used when a server action needs to call an edge function.
 */
async function invokeSupabaseFunction(functionName: string, body: object) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: JSON.stringify(body),
    });

    if (error) {
        console.error(`Error invoking Supabase function '${functionName}':`, error);
        return { error: `خطا در ارتباط با سرویس ابری (${functionName}).` };
    }
    
    // The function response is often nested, let's parse it.
    try {
      // Edge functions might return a stringified JSON body.
      const result = typeof data === 'string' ? JSON.parse(data) : data;
       if(result.error){
         console.error(`Error returned from Supabase function '${functionName}':`, result.error);
         return { error: result.error };
       }
       return { data: result };
    } catch (e) {
      console.error(`Error parsing response from Supabase function '${functionName}':`, e);
      return { error: 'پاسخ دریافتی از سرویس ابری نامعتبر است.' };
    }
}


/**
 * Initiates the login process by generating, storing, and sending an OTP via a Supabase Edge Function.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }
  
  const supabaseAdmin = createAdminClient();
  const normalizedPhone = normalizePhoneNumber(phone);
  
  // Generate a 6-digit random code
  const token = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the phone and token.
  // The `created_at` column will be automatically populated with `now()` by the database.
  const { error: upsertError } = await supabaseAdmin
    .from('one_time_passwords')
    .upsert({ 
        phone: normalizedPhone, 
        token: token,
        created_at: new Date().toISOString() // Explicitly set created_at
    }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('Error storing OTP:', upsertError);
    return { error: 'خطا در ذخیره‌سازی کد تایید. لطفاً دوباره تلاش کنید.' };
  }

  // Instead of calling Kavenegar directly, invoke the Supabase Edge Function.
  const { error: functionError } = await invokeSupabaseFunction('kavenegar-otp-sender', {
      phone: normalizedPhone,
      data: { token: token }
  });

  if (functionError) {
      // The error message from invokeSupabaseFunction is user-friendly.
      return { error: `خطا در ارسال کد تایید: ${functionError}` };
  }

  // Redirect to the verification page on success
  redirect(`/login/verify?phone=${phone}`);
}


/**
 * Verifies the OTP provided by the user.
 */
export async function verifyOtp(formData: FormData) {
    const phone = formData.get('phone') as string;
    const token = formData.get('pin') as string;

    if (!phone || !token) {
        return { error: 'شماره تلفن و کد تایید الزامی است.' };
    }

    const supabaseAdmin = createAdminClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    // 1. Check if a valid, non-expired OTP exists.
    // The time comparison is now done entirely inside the database using its own clock.
    const { data: otpEntry, error: selectError } = await supabaseAdmin
        .from('one_time_passwords')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('token', token)
        .gte('created_at', `now() - interval '5 minutes'`)
        .single();
    
    if (selectError || !otpEntry) {
        console.error('OTP validation failed:', selectError);
        // We can delete any potentially expired tokens for this number to allow a clean retry.
        await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
        return { error: 'کد تایید وارد شده نامعتبر است یا منقضی شده. لطفاً دوباره درخواست کد دهید.' };
    }
    
    // 2. OTP is correct. Now, get or create the user in Supabase Auth.
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listUsersError) {
        console.error('Supabase listUsers error:', listUsersError);
        return { error: 'خطا در بررسی وضعیت کاربر.' };
    }

    const existingUser = users.find(u => u.phone === normalizedPhone);
    
    // If the user does not exist, create them.
    if (!existingUser) {
        const { error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            phone: normalizedPhone,
            password: SUPABASE_MASTER_PASSWORD,
            phone_confirm: true, // Since we verified OTP, we can confirm the phone
        });

        if (signUpError) {
            console.error('Supabase Sign-Up Error during OTP verify:', signUpError);
            return { error: 'خطا در ایجاد حساب کاربری جدید.'};
        }
    }
    
    // 3. User exists or was just created. Now, sign them in to create a session.
    const supabase = createServerSupabaseClient();
    const { data: { session } , error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: SUPABASE_MASTER_PASSWORD,
    });

    if (sessionError) {
        console.error('Supabase Sign-In Error during OTP verify:', sessionError);
        return { error: `خطا در ورود به حساب کاربری.`};
    }
    
     if (!session?.user.user_metadata?.full_name) {
       // This is a new or incomplete user. Redirect to complete registration.
       await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
       redirect(`/register?phone=${phone}`);
     }

    // 4. Clean up the used OTP
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);

    // 5. Redirect to home page for fully registered users
    redirect('/');
}
