'use server';

import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiates the login OR sign-up process by generating an OTP and then
 * directly invoking our custom Edge Function to send it via Kavenegar.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }

  // Ensure the phone number is in E.164 format (+98...) before any Supabase call.
  const normalizedPhoneForSupabase = normalizePhoneNumber(phone);
  if (!normalizedPhoneForSupabase || !/^\+989\d{9}$/.test(normalizedPhoneForSupabase)) {
    console.error('Invalid phone number format after normalization:', normalizedPhoneForSupabase);
    return { error: 'فرمت شماره تلفن پس از نرمال‌سازی نامعتبر است.' };
  }

  const supabaseAdmin = createAdminClient();

  // Step 1: Use the admin client to generate an OTP for the user.
  // This creates the user if they don't exist and returns a token, but does NOT send it.
  const { data: otpData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink', // Using 'magiclink' type is a way to get an OTP for a phone number.
    phone: normalizedPhoneForSupabase,
  });

  if (generateError || !otpData?.properties?.otp_code) {
    console.error('Supabase admin.generateLink Error:', generateError);
    // Provide a more user-friendly error for validation issues.
    if (generateError?.code === 'validation_failed') {
        return { error: 'شماره تلفن وارد شده معتبر نیست. لطفاً دوباره بررسی کنید.' };
    }
    return { error: `خطا در ایجاد کد یکبار مصرف: ${generateError?.message}` };
  }

  const otpCode = otpData.properties.otp_code;
  const supabase = await createClient();

  // Step 2: Manually invoke our 'kavenegar-otp-sender' Edge Function.
  // We send the function secret in the Authorization header to bypass JWT verification.
  const functionSecret = process.env.SUPABASE_FUNCTION_SECRET;
  if (!functionSecret) {
      console.error('SUPABASE_FUNCTION_SECRET is not set in environment variables.');
      return { error: 'پیکربندی سمت سرور ناقص است. لطفاً با پشتیبانی تماس بگیرید.' };
  }

  const { error: invokeError } = await supabase.functions.invoke('kavenegar-otp-sender', {
    body: { phone: normalizedPhoneForSupabase, token: otpCode },
    headers: {
      'Authorization': `Bearer ${functionSecret}`
    }
  });

  if (invokeError) {
    console.error('Supabase functions.invoke Error:', invokeError);
    return { error: `خطا در ارسال کد از طریق سرویس پیامک: ${invokeError.message}` };
  }

  // Step 3: Redirect to verification page on success, passing the original (non-normalized) phone for display.
  redirect(`/login/verify?phone=${phone}`);
}


/**
 * Verifies the OTP, and because the user is now logged in,
 * checks if they have a profile. If not, redirects to complete registration.
 */
export async function verifyOtp(formData: FormData) {
    const phone = formData.get('phone') as string;
    const token = formData.get('pin') as string;

    if (!phone || !token) {
        return { error: 'شماره تلفن و کد تایید الزامی است.' };
    }
    
    const supabase = await createClient();
    // Use the normalized phone number for verification with Supabase.
    const normalizedPhone = normalizePhoneNumber(phone);

    // Verify the OTP which also creates the session for the user.
    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token,
        type: 'sms',
    });

    if (verifyError || !session) {
        console.error('Supabase verifyOtp Error:', verifyError);
        return { error: verifyError?.message || 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' };
    }
    
    // Now that the user is logged in, check if their profile exists.
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, account_type') // Select fields to check for completion
      .eq('id', session.user.id)
      .single();
    
    // A profile is considered incomplete if it doesn't exist OR if the full_name is missing.
    if (!profile || !profile.full_name) {
       // If no profile, they need to complete registration.
       redirect(`/register?phone=${phone}`);
     } else {
       // If profile exists and is complete, go home.
       redirect('/');
     }
}
