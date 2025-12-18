
'use server';

import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';


/**
 * Initiates the login OR sign-up process by sending an OTP.
 * This function now bypasses the problematic Auth Hook by invoking the 
 * 'kavenegar-otp-sender' Edge Function directly with the required secret.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }

  const supabase = await createClient();
  const normalizedPhone = normalizePhoneNumber(phone);

  // Instead of signInWithOtp, we now use the admin client to generate the OTP
  // and then manually invoke our own function to send it.
  const supabaseAdmin = createAdminClient();

  // Generate an OTP for the user. This creates the user if they don't exist.
  // We use `generateLink` with `type: 'magiclink'` as a way to get an OTP (`token`).
  // The 'sms' type for generateLink is not available, but this works.
  const { data, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    phone: normalizedPhone,
  });

  if (generateError || !data.properties?.hashed_token) {
    console.error('Supabase admin.generateLink Error:', generateError);
    return { error: `خطا در ایجاد کد یکبار مصرف: ${generateError?.message}` };
  }
  
  // The 'otp_code' is the plain text token we need to send.
  const otpCode = data.properties.otp_code;
  if(!otpCode) {
    return { error: 'خطا: کد یکبار مصرف توسط سوپابیس تولید نشد.' };
  }

  // Now, manually invoke the Edge Function with the required secret.
  const functionSecret = process.env.SUPABASE_FUNCTION_SECRET;
  if (!functionSecret) {
      console.error('SUPABASE_FUNCTION_SECRET is not set in environment variables.');
      return { error: 'پیکربندی سمت سرور ناقص است. لطفاً با پشتیبانی تماس بگیرید.' };
  }

  const { error: invokeError } = await supabase.functions.invoke('kavenegar-otp-sender', {
    body: { phone: normalizedPhone, token: otpCode },
    headers: {
      // This is the crucial part: sending the secret.
      'Authorization': `Bearer ${functionSecret}`
    }
  });

  if (invokeError) {
    console.error('Supabase functions.invoke Error:', invokeError);
    return { error: `خطا در ارسال کد از طریق سرویس پیامک: ${invokeError.message}` };
  }

  // Redirect to verification page on success
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
      .select('id')
      .eq('id', session.user.id)
      .single();
    
    if (!profile) {
       // If no profile, they need to complete registration.
       redirect(`/register?phone=${phone}`);
     } else {
       // If profile exists, they are fully registered.
       redirect('/');
     }
}

