
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth, normalizeForKavenegar } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiates the login OR sign-up process by generating an OTP and then
 * directly invoking our custom Edge Function to send it via Kavenegar.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  
  // --- STEP 1: LOG RAW INPUT ---
  console.log('--- STARTING requestOtp ACTION ---');
  console.log('1. RAW PHONE FROM FORM:', phone);
  console.log(`   - Type: ${typeof phone}, Length: ${phone?.length}`);

  let normalizedForSupabase: string;
  let normalizedForKavenegar: string;

  try {
    // Normalize for each service.
    normalizedForSupabase = normalizeForSupabaseAuth(phone);
    normalizedForKavenegar = normalizeForKavenegar(phone);

    // --- STEP 2: LOG NORMALIZED OUTPUTS ---
    console.log('2. NORMALIZED FOR SUPABASE (E.164):', normalizedForSupabase);
    console.log('3. NORMALIZED FOR KAVENEGAR (LOCAL):', normalizedForKavenegar);

  } catch (error: any) {
    console.error('Phone normalization error:', error.message);
    return { error: error.message };
  }

  const supabaseAdmin = createAdminClient();

  // Step 3: Use the admin client to generate an OTP for the user.
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

  // Step 4: Manually invoke our 'kavenegar-otp-sender' Edge Function.
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

  // Step 5: Redirect to verification page on success.
  console.log('--- ACTION COMPLETED SUCCESSFULLY. REDIRECTING... ---');
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
