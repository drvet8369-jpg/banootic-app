
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

  // Store the phone and token in our custom OTP table
  const { error: upsertError } = await supabaseAdmin
    .from('one_time_passwords')
    .upsert({ phone: normalizedPhone, token: token }, { onConflict: 'phone' });

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

    // 1. Fetch the stored OTP from our custom table
    const { data: otpEntry, error: fetchError } = await supabaseAdmin
        .from('one_time_passwords')
        .select('token, created_at')
        .eq('phone', normalizedPhone)
        .single();
    
    if (fetchError || !otpEntry) {
        console.error('Error fetching OTP or OTP not found:', fetchError);
        return { error: 'کد تایید یافت نشد یا نامعتبر است. لطفاً دوباره درخواست کد دهید.' };
    }

    // 2. Check if the token is expired (e.g., 5 minutes validity)
    const otpCreatedAt = new Date(otpEntry.created_at);
    const now = new Date();
    const expiresIn = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (now.getTime() - otpCreatedAt.getTime() > expiresIn) {
        await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
        return { error: 'کد تایید منقضی شده است. لطفاً دوباره درخواست کد دهید.' };
    }

    // 3. Check if the token matches
    if (otpEntry.token !== token) {
        return { error: 'کد تایید وارد شده نامعتبر است.' };
    }

    // 4. OTP is correct. Now, get or create the user in Supabase Auth.
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.getUserByPhone(normalizedPhone);

    if (userCheckError && userCheckError.message !== 'User not found') {
        console.error('Supabase user check error:', userCheckError);
        return { error: 'خطا در بررسی وضعیت کاربر.' };
    }
    
    // If the user does not exist, create them.
    if (!existingUser) {
        const { error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            phone: normalizedPhone,
            password: SUPABASE_MASTER_PASSWORD,
            phone_confirm: true, // Since we verified OTP, we can confirm the phone
            user_metadata: {
              full_name: `کاربر ${phone.slice(-4)}`,
              account_type: 'customer'
            }
        });

        if (signUpError) {
            console.error('Supabase Sign-Up Error during OTP verify:', signUpError);
            return { error: 'خطا در ایجاد حساب کاربری جدید.'};
        }
    }
    
    // 5. User exists or was just created. Now, sign them in to create a session.
    const supabase = createServerSupabaseClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: SUPABASE_MASTER_PASSWORD,
    });

    if (sessionError) {
        console.error('Supabase Sign-In Error during OTP verify:', sessionError);
        return { error: `خطا در ورود به حساب کاربری.`};
    }

    // 6. Clean up the used OTP
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);

    // 7. Redirect to home page
    redirect('/');
}
