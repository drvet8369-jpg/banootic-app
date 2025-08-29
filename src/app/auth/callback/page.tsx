'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // The session is automatically set by the Supabase client library
      // when the user is redirected back from the magic link.
      // We just need to check if the user is now logged in and redirect.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        toast({
          title: 'خطای احراز هویت',
          description: 'مشکلی در برقراری ارتباط با سرور پیش آمد.',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }
      
      if (session) {
        toast({
          title: 'ورود موفق',
          description: 'شما با موفقیت وارد شدید. در حال انتقال...',
        });
        // A hard refresh to ensure all server components get the new user session
        // and the AuthProvider can correctly fetch the user profile.
        window.location.href = '/';
      } else {
        // This might happen if the token is invalid or expired
        toast({
          title: 'خطا در ورود',
          description: 'لینک ورود نامعتبر یا منقضی شده است. لطفاً دوباره تلاش کنید.',
          variant: 'destructive',
        });
        router.push('/login');
      }
    };
    
    handleAuthCallback();
  }, [router, supabase, toast]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
      <h1 className="font-headline text-3xl font-bold">تکمیل فرآیند ورود...</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        لطفاً چند لحظه صبر کنید. در حال تایید اطلاعات شما هستیم.
      </p>
    </div>
  );
}
