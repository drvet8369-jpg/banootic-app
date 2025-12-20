'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { toast } from 'sonner';


export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  let normalizedPhone: string;

  try {
    normalizedPhone = normalizeForSupabaseAuth(phone);
  } catch (error: any) {
    return { error: error.message };
  }

  const supabase = await createClient();

  // This is the final, correct call. It tells Supabase:
  // 1. To generate and save an OTP.
  // 2. To use your Kavenegar Hook to send it.
  // 3. To use the service_role key for a secure hook call, which avoids JWT errors.
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      // This line is crucial for Supabase to securely call your hook.
      // We are NOT sending a token manually. This tells Supabase to use its own internal secure token.
      data: {
        use_service_role: true,
      },
    },
  });

  if (error) {
    console.error('Supabase signInWithOtp Error:', error);
    // Return a user-friendly error from Supabase.
    return { error: error.message || 'خطا در ارتباط با سرویس احراز هویت.' };
  }
  
  // On success, redirect the user to the verification page.
  redirect(`/login/verify?phone=${phone}`);
}


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
    
    // If the user has logged in but has not completed their profile,
    // redirect them to the registration completion page.
    if (!profile || !profile.full_name) {
       redirect(`/register?phone=${phone}`);
     } else {
       // Otherwise, send them to the homepage.
       redirect('/');
     }
}
