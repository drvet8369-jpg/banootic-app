'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { toast } from 'sonner';


export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  
  // This is a temporary debugging step.
  // We will directly invoke the 'log-catcher' function to test it.
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke('log-catcher', {
      body: { message: 'Direct invoke test from actions.ts', phone: phone },
    });

    if (error) {
      // If we can't even invoke the function, there's a problem.
      return { error: `Error invoking log-catcher: ${error.message}` };
    }

    // Return the successful response from the function to be displayed on screen.
    return { error: `EDGE FUNCTION LOG\nStatus: 200 OK\nResponse: ${JSON.stringify(data)}` };

  } catch (e: any) {
    return { error: `A critical error occurred: ${e.message}` };
  }
}


export async function verifyOtp(formData: FormData) {
    // This function is temporarily disabled for debugging.
    return { error: 'Verify function is currently offline for debugging.' };
}
