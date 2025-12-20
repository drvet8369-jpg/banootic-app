
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

/**
 * Requests Supabase to generate and send an OTP via the configured SMS Hook.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  const supabase = await createClient();

  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeForSupabaseAuth(phone);
  } catch (error: any) {
    return { error: error.message };
  }

  // This single call tells Supabase to generate an OTP and send it
  // using the pre-configured Auth Hook (which points to our Kavenegar function).
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    console.error('Supabase signInWithOtp Error:', error);
    // Provide a user-friendly error message. The detailed error is logged on the server.
    return { error: `خطا در ارسال کد: ${error.message}` };
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
    
    const { data: profile } = await supabase
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
