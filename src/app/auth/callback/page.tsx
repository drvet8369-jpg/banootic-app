
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This page is no longer needed for the OTP flow as verification happens on the verify page.
// However, it's kept for potential future use with email magic links.
// We redirect to home as the session should have been set.
export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    toast({
        title: 'در حال انتقال...',
        description: 'در حال انتقال شما به صفحه اصلی.',
    });
    router.push('/');
  }, [router, toast]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
      <h1 className="font-headline text-3xl font-bold">تکمیل فرآیند ورود...</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        جلسه شما تایید شد. در حال انتقال به صفحه اصلی هستید.
      </p>
    </div>
  );
}
