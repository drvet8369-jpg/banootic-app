
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

/**
 * THIS IS A TEMPORARY DEBUGGING FUNCTION.
 * It directly calls the Kavenegar edge function to see its response.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const functionUrl = `${supabaseUrl}/functions/v1/kavenegar-otp-sender`;

  const testPayload = {
    phone: phone,
    token: "123456" // A test token
  };

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(testPayload),
    });

    const responseBody = await response.text();

    const debugString = `
      EDGE FUNCTION DEBUG:
      - Status: ${response.status} ${response.statusText}
      - Response Body: ${responseBody}
    `;

    // Return the debug string as an error to be displayed in the toast.
    return { error: debugString };

  } catch (e: any) {
    const errorString = `
      FETCH FAILED:
      - Error: ${e.message}
      - Cause: ${e.cause || 'N/A'}
    `;
    return { error: errorString };
  }
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
    
    const { data: profile } = await supabase
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
