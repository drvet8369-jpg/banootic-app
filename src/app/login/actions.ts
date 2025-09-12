'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';

const KAVEHNEGAR_API_KEY = process.env.KAVEHNEGAR_API_KEY;

/**
 * Sends an OTP code via Kavenegar API.
 * This function directly calls the Kavenegar service.
 */
async function sendKavenegarOtp(phone: string, token: string) {
  if (!KAVEHNEGAR_API_KEY) {
    console.error('Kavenegar API Key is not set in environment variables.');
    return { error: 'کلید API کاوه نگار یافت نشد. سرویس پیامک پیکربندی نشده است.' };
  }

  const url = `https://api.kavenegar.com/v1/${KAVEHNEGAR_API_KEY}/verify/lookup.json`;
  const params = new URLSearchParams({
    receptor: phone,
    template: 'logincode',
    token: token,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const responseBody = await response.json();

    if (!response.ok || responseBody.return.status !== 200) {
      console.error('Kavenegar API Error:', responseBody.return.message);
      return { error: `خطا در ارسال پیامک: ${responseBody.return.message}` };
    }
    
    return { success: true };

  } catch (error) {
    console.error('Fetch error for Kavenegar API:', error);
    return { error: 'خطا در ارتباط با سرویس پیامک.' };
  }
}


/**
 * Initiates the login process by generating, storing, and sending an OTP.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }
  
  const supabase = createAdminClient();
  const normalizedPhone = normalizePhoneNumber(phone);
  
  // Generate a 6-digit random code
  const token = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the phone and token in our custom OTP table
  const { error: upsertError } = await supabase
    .from('one_time_passwords')
    .upsert({ phone: normalizedPhone, token: token }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('Error storing OTP:', upsertError);
    return { error: 'خطا در ذخیره‌سازی کد تایید. لطفاً دوباره تلاش کنید.' };
  }

  // Directly send the OTP via Kavenegar
  const sendResult = await sendKavenegarOtp(normalizedPhone, token);

  if (sendResult.error) {
      return { error: sendResult.error };
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

    // 4. OTP is correct. Create Supabase auth session.
    const supabase = createServerSupabaseClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: process.env.SUPABASE_MASTER_PASSWORD!,
    });

    if (sessionError) {
         if (sessionError.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
                phone: normalizedPhone,
                password: process.env.SUPABASE_MASTER_PASSWORD!,
                options: {
                  data: {
                    full_name: `کاربر ${phone.slice(-4)}`,
                    account_type: 'customer'
                  }
                }
            });
            if (signUpError) {
                console.error('Supabase Sign-Up Error during OTP verify:', signUpError);
                return { error: 'خطا در ایجاد حساب کاربری جدید.'};
            }
             // After sign-up, need to sign in again to create a session
            const { error: signInAgainError } = await supabase.auth.signInWithPassword({
              phone: normalizedPhone,
              password: process.env.SUPABASE_MASTER_PASSWORD!,
            });
            if (signInAgainError) {
               console.error('Supabase Sign-In After Sign-Up Error:', signInAgainError);
               return { error: 'خطا در ورود پس از ثبت‌نام.' };
            }

         } else {
            console.error('Supabase Sign-In Error during OTP verify:', sessionError);
            return { error: `خطا در ورود به حساب کاربری: ${sessionError.message}`};
        }
    }

    // 5. Clean up the used OTP
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);

    // 6. Redirect to home page
    redirect('/');
}
