
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This page handles the user's session after they click the magic link.
export default function AuthCallbackPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // This event fires once the user is redirected back from the magic link.
      if (event === 'SIGNED_IN' && session) {
         toast({
            title: 'ورود موفق',
            description: 'شما با موفقیت وارد حساب کاربری خود شدید.',
          });
        // Now that the session is set, redirect to the homepage.
        // A refresh is needed to ensure server components re-render with the new auth state.
        router.push('/');
        router.refresh(); 
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, toast]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
      <h1 className="font-headline text-3xl font-bold">در حال ورود شما...</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        در حال تایید هویت و ایجاد جلسه امن برای شما هستیم. لطفاً چند لحظه صبر کنید.
      </p>
    </div>
  );
}
