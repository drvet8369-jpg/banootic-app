
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth, normalizeForKavenegar } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * DEBUGGING VERSION:
 * This function is temporarily modified to return debug information
 * directly to the client instead of processing the login.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;

  let rawPhoneInfo = `1. RAW PHONE FROM FORM: '${phone}' (Length: ${phone?.length})`;
  let normalizedForSupabase = 'N/A';
  let normalizedForKavenegar = 'N/A';
  let normalizationError = '';

  try {
    normalizedForSupabase = normalizeForSupabaseAuth(phone);
    normalizedForKavenegar = normalizeForKavenegar(phone);
  } catch (error: any) {
    normalizationError = `ERROR during normalization: ${error.message}`;
  }

  const supabaseDebugInfo = `2. NORMALIZED FOR SUPABASE: '${normalizedForSupabase}'`;
  const kavenegarDebugInfo = `3. NORMALIZED FOR KAVENEGAR: '${normalizedForKavenegar}'`;

  // Combine all debug info into a single message.
  const debugMessage = [
    rawPhoneInfo,
    supabaseDebugInfo,
    kavenegarDebugInfo,
    normalizationError,
  ].filter(Boolean).join(' | ');

  // Return the debug message as an error to be displayed on the client.
  return { error: debugMessage };

  // The original logic is commented out below for now.
  /*
  const supabaseAdmin = createAdminClient();

  console.log('4. Calling Supabase admin.generateLink with:', normalizedForSupabase);
  const { data: otpData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    phone: normalizedForSupabase,
  });

  if (generateError || !otpData?.properties?.otp_code) {
    console.error('5. Supabase admin.generateLink FAILED:', generateError);
    if (generateError?.code === 'validation_failed' || generateError?.message.includes('Invalid phone number')) {
        return { error: 'شماره تلفن وارد شده در سمت سرور معتبر تشخیص داده نشد.' };
    }
    return { error: `خطا در ایجاد کد یکبار مصرف: ${generateError?.message}` };
  }
  console.log('5. Supabase admin.generateLink SUCCEEDED.');

  const otpCode = otpData.properties.otp_code;
  const supabase = await createClient();

  const functionSecret = process.env.SUPABASE_FUNCTION_SECRET;
  if (!functionSecret) {
      console.error('6. SUPABASE_FUNCTION_SECRET is not set.');
      return { error: 'پیکربندی سمت سرور ناقص است.' };
  }
  console.log('6. Calling Kavenegar Edge Function...');
  const { error: invokeError } = await supabase.functions.invoke('kavenegar-otp-sender', {
    body: { phone: normalizedForKavenegar, token: otpCode },
    headers: {
      'Authorization': `Bearer ${functionSecret}`
    }
  });

  if (invokeError) {
    console.error('7. Kavenegar Edge Function FAILED:', invokeError);
    return { error: `خطا در ارسال کد از طریق سرویس پیامک: ${invokeError.message}` };
  }
  console.log('7. Kavenegar Edge Function SUCCEEDED.');

  redirect(`/login/verify?phone=${phone}`);
  */
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
    
    if (!profile || !profile.full_name) {
       redirect(`/register?phone=${phone}`);
     } else {
       redirect('/');
     }
}
