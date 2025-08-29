
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

const otpSchema = z.object({
  token: z.string().min(6, { message: 'کد تایید باید ۶ رقم باشد.' }).max(6, { message: 'کد تایید باید ۶ رقم باشد.' }),
});

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  
  const phone = searchParams.get('phone');

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  if (!phone) {
    return (
      <div className="text-center text-destructive">
        <p>خطا: شماره تلفن یافت نشد. لطفاً به صفحه ورود بازگردید.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/login">بازگشت به ورود</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof otpSchema>) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone!,
        token: values.token,
        type: 'sms',
      });

      if (error) {
        throw new Error('کد تایید نامعتبر است یا منقضی شده است.');
      }
      
      if (data.session) {
        toast({
          title: 'ورود موفق',
          description: 'شما با موفقیت وارد حساب کاربری خود شدید.',
        });
        // Force a full page reload to ensure server components get the new session
        window.location.href = '/';
      } else {
         throw new Error('جلسه کاربری ایجاد نشد. لطفاً دوباره تلاش کنید.');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد.';
      toast({ title: 'خطا در تایید کد', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">تایید کد ورود</CardTitle>
        <CardDescription>
          کد ۶ رقمی ارسال شده به شماره <span dir="ltr" className="font-semibold text-foreground">{phone}</span> را وارد کنید.
          <br/>
          (در محیط تست، از کد `123456` استفاده کنید)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>کد تایید ۶ رقمی</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="· · · · · ·" 
                      {...field} 
                      disabled={isLoading} 
                      dir="ltr" 
                      className="text-center text-lg tracking-[0.5em]" 
                      maxLength={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تایید و ورود
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="underline">
            بازگشت و تغییر شماره تلفن
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
    return (
        <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
            <Suspense fallback={<Loader2 className="w-12 h-12 animate-spin text-primary" />}>
                <VerifyOtpForm />
            </Suspense>
        </div>
    )
}
