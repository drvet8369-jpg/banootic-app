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
  // We explicitly set created_at so the database doesn't have to.
  const { error: upsertError } = await supabaseAdmin
    .from('one_time_passwords')
    .upsert({ 
        phone: normalizedPhone, 
        token: token,
        created_at: new Date().toISOString()
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
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 1. Verify the OTP against the one_time_passwords table
    const { data: otpEntry, error: selectError } = await supabaseAdmin
        .from('one_time_passwords')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('token', token)
        .gt('created_at', fiveMinutesAgo)
        .single();
    
    if (selectError || !otpEntry) {
        console.error('OTP validation failed:', selectError);
        return { error: 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' };
    }

    // 2. User exists or was just created. Now, check if the user exists in Supabase Auth.
    let userId: string;
    let userFullName: string | undefined;

    try {
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserByPhone(normalizedPhone);

        if (userError) {
            // If the error is "User not found", we can proceed to create one.
            if (userError.message.includes('User not found')) {
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    phone: normalizedPhone,
                    password: SUPABASE_MASTER_PASSWORD,
                    phone_confirm: true,
                });

                if (createError || !newUser?.user) {
                    console.error('Supabase Sign-Up Error:', createError);
                    return { error: `خطا در ایجاد حساب کاربری جدید: ${createError?.message}` };
                }
                userId = newUser.user.id;
                // For a new user, there's no full name yet.
                userFullName = undefined;

            } else {
                // Any other error from getUserByPhone is a problem.
                throw userError;
            }
        } else {
            // User was found successfully.
            userId = user.id;
            userFullName = user.user_metadata?.full_name;
        }

    } catch (error: any) {
        console.error('Error during user check/creation:', error.message);
        return { error: `خطایی در سیستم احراز هویت رخ داد: ${error.message}` };
    }
    
    // 3. User exists or was just created. Now, sign them in to create a session.
    const supabase = createServerSupabaseClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: SUPABASE_MASTER_PASSWORD,
    });

    if (sessionError) {
        console.error('Supabase Sign-In Error during OTP verify:', sessionError);
        return { error: `خطا در ورود به حساب کاربری: ${sessionError.message}`};
    }
    
     // 4. Clean up the used OTP
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
    
    // 5. Redirect based on whether the user profile is complete
    if (!userFullName) {
       // This is a new user or their profile is incomplete. Redirect to complete registration.
       redirect(`/register?phone=${phone}`);
     }

    // This is an existing, fully registered user. Redirect to home.
    redirect('/');
}
