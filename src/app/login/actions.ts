
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function requestOtp(formData: FormData) {
  'use server';

  const phone = formData.get('phone') as string;

  try {
    const supabase = await createClient();
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      // This is the primary error that the user sees.
      // If it says "unexpected failure", it's an issue with the Auth Hook configuration.
      const detailedError = `Supabase signInWithOtp Error: ${error.message}`;
      console.error(detailedError);
      return { error: detailedError };
    }
  } catch (e: any) {
    console.error('Critical error in requestOtp action:', e);
    return { error: `A critical error occurred: ${e.message}` };
  }

  // On successful OTP request, redirect to the verification page.
  redirect(`/login/verify?phone=${phone}`);
}
