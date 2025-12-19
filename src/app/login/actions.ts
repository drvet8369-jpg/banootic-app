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
  let normalizedPhoneForSupabase: string;

  try {
    // This is the single point of truth for normalization. If it fails, we stop.
    normalizedPhoneForSupabase = normalizePhoneNumber(phone);
  } catch (error: any) {
    console.error('Phone normalization error:', error.message);
    return { error: error.message };
  }

  const supabaseAdmin = createAdminClient();

  // Step 1: Use the admin client to generate an OTP for the user.
  const { data: otpData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    phone: normalizedPhoneForSupabase,
  });

  if (generateError || !otpData?.properties?.otp_code) {
    console.error('Supabase admin.generateLink Error:', generateError);
    // Supabase often returns a generic message for validation failures.
    // We provide a more user-friendly error.
    if (generateError?.code === 'validation_failed' || generateError?.message.includes('Invalid phone number')) {
        return { error: 'شماره تلفن وارد شده در سمت سرور نامعتبر تشخیص داده شد.' };
    }
    return { error: `خطا در ایجاد کد یکبار مصرف: ${generateError?.message}` };
  }

  const otpCode = otpData.properties.otp_code;
  const supabase = await createClient();

  // Step 2: Manually invoke our 'kavenegar-otp-sender' Edge Function.
  const functionSecret = process.env.SUPABASE_FUNCTION_SECRET;
  if (!functionSecret) {
      console.error('SUPABASE_FUNCTION_SECRET is not set.');
      return { error: 'پیکربندی سمت سرور ناقص است.' };
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

  // Step 3: Redirect to verification page on success. Pass the original, unnormalized phone for display purposes.
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
    
    let normalizedPhone: string;
    try {
        normalizedPhone = normalizePhoneNumber(phone);
    } catch (error: any) {
        return { error: error.message };
    }

    const supabase = await createClient();

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
