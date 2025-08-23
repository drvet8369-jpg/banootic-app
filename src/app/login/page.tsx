'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound } from 'lucide-react';
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
import { normalizePhoneNumber } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';


const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});

const otpSchema = z.object({
  phone: z.string(),
  token: z.string().min(6, { message: 'کد تایید باید ۶ رقم باشد.' }),
});


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const supabase = createClient();

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { phone: '', token: '' },
  });


  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setIsLoading(true);
    const normalizedPhone = normalizePhoneNumber(values.phone);
    setPhone(normalizedPhone);

    const { error } = await supabase.auth.signInWithOtp({
        phone: `+98${normalizedPhone.substring(1)}`, // Convert to international format
    });

    if (error) {
        toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'کد تایید ارسال شد', description: 'لطفاً کد ۶ رقمی ارسال شده به شماره خود را وارد کنید.' });
        setStep('otp');
        otpForm.setValue('phone', `+98${normalizedPhone.substring(1)}`);
    }
    setIsLoading(false);
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    setIsLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
        phone: values.phone,
        token: values.token,
        type: 'sms',
    });

    if (error) {
        toast({ title: 'خطا', description: 'کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید.', variant: 'destructive' });
    } else {
         toast({
            title: 'ورود با موفقیت انجام شد!',
            description: `خوش آمدید! در حال هدایت شما...`,
         });
         // The AuthContext will automatically pick up the new user session
         router.push('/');
         router.refresh(); // Force a refresh to update server components
    }
    setIsLoading(false);
  }

  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            {step === 'phone' 
             ? 'برای ورود یا ساخت حساب کاربری، شماره تلفن خود را وارد کنید.'
             : `کد ۶ رقمی ارسال شده به شماره ${phone} را وارد کنید.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره تلفن</FormLabel>
                      <FormControl>
                        <Input placeholder="09123456789" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <KeyRound className="ml-2 h-4 w-4" />}
                  ارسال کد تایید
                </Button>
              </form>
            </Form>
          ) : (
             <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کد تایید</FormLabel>
                      <FormControl>
                        <Input placeholder="******" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  ورود
                </Button>
                <Button variant="link" onClick={() => setStep('phone')} className="w-full">
                  ویرایش شماره تلفن
                </Button>
              </form>
            </Form>
          )}
          <div className="mt-4 text-center text-sm">
            هنرمند هستید؟{" "}
            <Link href="/register" className="underline">
              از اینجا ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
