
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export async function requestOtp(formData: FormData) {
  'use server';

  const phone = formData.get('phone') as string;

  try {
    const supabase = await createClient();
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    // This option tells Supabase to use its `service_role` key when invoking the hook,
    // which is required for security.
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
        data: { use_service_role: true } as any, 
      },
    });

    if (error) {
      console.error('Supabase signInWithOtp Error:', error);
      // Return the full error message to be displayed in the UI.
      return { error: `Supabase Error: ${error.message}` };
    }
  } catch (e: any) {
    console.error('Critical error in requestOtp action:', e);
    return { error: `A critical error occurred: ${e.message}` };
  }

  // On successful OTP request, redirect to the verification page.
  redirect(`/login/verify?phone=${phone}`);
}


export async function verifyOtp(formData: FormData) {
  'use server';
  
  const phone = formData.get('phone') as string;
  const pin = formData.get('pin') as string;
  
  if (!phone || !pin) {
    return { error: "شماره تلفن و کد تایید الزامی است." };
  }

  const supabase = await createClient();
  const normalizedPhone = normalizeForSupabaseAuth(phone);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: pin,
    type: 'sms',
  });

  if (error) {
    console.error("Supabase verifyOtp Error:", error);
    return { error: `کد تایید نامعتبر است: ${error.message}` };
  }

  // Check if a profile already exists for this user.
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, account_type')
      .eq('id', data.user.id)
      .single();

    // If profile exists and is complete, redirect to the appropriate page.
    if (profile?.full_name) {
       redirect(profile.account_type === 'provider' ? '/profile' : '/');
    }
  }
  
  // If no profile exists, or it's incomplete, redirect to the registration completion page.
  redirect(`/register?phone=${phone}`);
}
