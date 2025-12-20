
'use server';

import { redirect } from 'next/navigation';
import { normalizeForKavenegar, normalizeForSupabaseAuth } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Generates an OTP via Supabase and sends it using the Kavenegar Edge Function.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;

  let normalizedForSupabase: string;
  let normalizedForKavenegar: string;
  try {
    normalizedForSupabase = normalizeForSupabaseAuth(phone);
    normalizedForKavenegar = normalizeForKavenegar(phone);
  } catch (error: any) {
    return { error: error.message };
  }

  const supabaseAdmin = createAdminClient();

  // This call generates the OTP code associated with the phone number.
  const { data: otpData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    phone: normalizedForSupabase,
  });

  if (generateError || !otpData?.properties?.otp_code) {
    console.error('Supabase admin.generateLink FAILED:', generateError);
    // This custom error message is key to debugging Supabase phone auth setup.
    if (generateError?.code === 'validation_failed' || generateError?.message.includes('Invalid phone number')) {
        return { error: 'شماره تلفن وارد شده در سمت سرور معتبر تشخیص داده نشد. (ممکن است احراز هویت با شماره تلفن در Supabase فعال نباشد)' };
    }
    return { error: `خطا در ایجاد کد یکبار مصرف: ${generateError?.message}` };
  }

  const otpCode = otpData.properties.otp_code;
  const supabase = await createClient();

  const functionSecret = process.env.SUPABASE_FUNCTION_SECRET;
  if (!functionSecret) {
      console.error('SUPABASE_FUNCTION_SECRET is not set.');
      return { error: 'پیکربندی سمت سرور ناقص است.' };
  }

  // This call invokes our custom Edge Function to send the SMS via Kavenegar.
  const { error: invokeError } = await supabase.functions.invoke('kavenegar-otp-sender', {
    body: { phone: normalizedForKavenegar, token: otpCode },
    headers: {
      'Authorization': `Bearer ${functionSecret}`
    }
  });

  if (invokeError) {
    console.error('Kavenegar Edge Function FAILED:', invokeError);
    return { error: `خطا در ارسال کد از طریق سرویس پیامک: ${invokeError.message}` };
  }

  // On success, redirect the user to the verification page.
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
        normalizedPhone = normalizeForSupabaseAuth(phone);
    } catch (error: any) {
        return { error: error.message };
    }

    const supabase = await createClient();

    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token,
        type: 'sms',
    });

    if (verifyError || !session) {
        console.error('Supabase verifyOtp Error:', verifyError);
        return { error: verifyError?.message || 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' };
    }
    
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, account_type')
      .eq('id', session.user.id)
      .single();
    
    // If the user has logged in but has no profile, they need to complete registration.
    if (!profile || !profile.full_name) {
       redirect(`/register?phone=${phone}`);
     } else {
       // Otherwise, they are a returning user, send them to the home page.
       redirect('/');
     }
}
