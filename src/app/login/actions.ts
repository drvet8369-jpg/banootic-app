
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

/**
 * Requests Supabase to generate and send an OTP using the pre-configured Auth Hook.
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

  // This is the key part: we wrap the Supabase call in a try/catch.
  // If ANY error happens (including errors from the hook), we catch it
  // and return it to the UI.
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        // This line tells Supabase to use its powerful service_role key
        // to call our Edge Function, which is necessary when the function is secured.
        data: {
          use_service_role: true,
        },
      },
    });

    if (error) {
      // If Supabase itself returns an error object, return its message.
      return { error: `Supabase Error: ${error.message}` };
    }

  } catch (e: any) {
    // If the call throws a completely unexpected exception, catch that too.
    return { error: `Caught Exception: ${e.message}` };
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
