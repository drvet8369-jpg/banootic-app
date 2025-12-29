
'use client';

import { Suspense, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { normalizeForSupabaseAuth } from '@/lib/utils';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/lib/constants';
import { completeRegistrationAction, verifyOtpAction } from './actions';

// --- Schemas ---

const OTPSchema = z.object({
  pin: z.string().min(6, { message: "کد تایید باید ۶ رقم باشد." }),
});

const RegistrationSchema = z.object({
  name: z.string().min(2, { message: 'نام باید حداقل ۲ حرف داشته باشد.' }),
  accountType: z.enum(['customer', 'provider'], { required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.' }),
  serviceType: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
}).refine(data => data.accountType === 'provider' ? !!data.serviceType : true, {
  message: 'لطفاً نوع خدمات را انتخاب کنید.',
  path: ['serviceType'],
}).refine(data => data.accountType === 'provider' ? (data.bio && data.bio.length >= 10) : true, {
  message: 'بیوگرافی باید حداقل ۱۰ کاراکتر باشد.',
  path: ['bio'],
}).refine(data => data.accountType === 'provider' ? !!data.location : true, {
    message: 'لطفاً شهر خود را وارد کنید.',
    path: ['location'],
});

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

// --- Sub-components ---

function RegistrationForm({ onComplete }: { onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: { name: '', accountType: 'customer', bio: '', location: 'ارومیه' },
  });
  const accountType = form.watch('accountType');

  async function onSubmit(values: RegistrationFormValues) {
    setIsLoading(true);
    toast.loading("در حال تکمیل ثبت‌نام...");
    
    const result = await completeRegistrationAction(values);
    toast.dismiss();

    if (result.error) {
      toast.error("خطا در ثبت‌نام", { description: result.error });
      setIsLoading(false);
    } else {
      toast.success("ثبت‌نام با موفقیت انجام شد! به صفحه جدید هدایت می‌شوید.");
      onComplete(); // Trigger redirect in parent
    }
  }

  return (
     <Card className="mx-auto max-w-lg w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">تکمیل اطلاعات</CardTitle>
        <CardDescription>فقط یک قدم دیگر باقی مانده است. لطفاً اطلاعات زیر را کامل کنید.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>نام کامل یا نام کسب‌وکار</FormLabel>
                <FormControl><Input placeholder="نام خود را وارد کنید" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="accountType" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>نوع حساب کاربری:</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1" disabled={isLoading}>
                    <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="customer" /></FormControl><FormLabel className="font-normal">مشتری هستم</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="provider" /></FormControl><FormLabel className="font-normal">هنرمند هستم</FormLabel></FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {accountType === 'provider' && (
              <>
                <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع خدمات</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl><SelectTrigger><SelectValue placeholder="یک دسته‌بندی خدمات انتخاب کنید" /></SelectTrigger></FormControl>
                      <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                        <FormLabel>شهر</FormLabel>
                        <FormControl><Input placeholder="مثال: ارومیه" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>بیوگرافی کوتاه</FormLabel>
                    <FormControl><Textarea placeholder="کمی در مورد خدمات و هنر خود به ما بگویید" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تکمیل ثبت‌نام و ورود
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function VerifyOTPForm({ phone, onVerified }: { phone: string, onVerified: (isNewUser: boolean, redirectPath: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const otpForm = useForm<z.infer<typeof OTPSchema>>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { pin: "" },
  });

  async function onOTPSubmit(data: z.infer<typeof OTPSchema>) {
    setIsLoading(true);
    toast.loading("در حال تایید کد...");

    const result = await verifyOtpAction(phone, data.pin);
    toast.dismiss();

    if (result.error) {
      toast.error("خطا در تایید کد", { description: result.error });
      setIsLoading(false);
    } else {
      onVerified(result.isNewUser, result.redirectPath || '/');
    }
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">تایید شماره تلفن</CardTitle>
        <CardDescription>کد ۶ رقمی ارسال شده به شماره {phone} را وارد کنید.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-6">
            <FormField control={otpForm.control} name="pin" render={({ field }) => (
              <FormItem>
                <FormLabel>کد تایید</FormLabel>
                <FormControl>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup dir="ltr">
                        <InputOTPSlot index={0} /> <InputOTPSlot index={1} /> <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} /> <InputOTPSlot index={4} /> <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تایید و ورود
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  
  const [pageState, setPageState] = useState<'VERIFY_OTP' | 'REGISTER' | 'REDIRECTING'>('VERIFY_OTP');
  const [redirectPath, setRedirectPath] = useState('/');

  const handleVerification = (isNewUser: boolean, path: string) => {
    setRedirectPath(path);
    if (isNewUser) {
      setPageState('REGISTER');
    } else {
      setPageState('REDIRECTING');
      toast.success("شما با موفقیت وارد شدید!");
    }
  };

  const handleRegistrationComplete = () => {
     setPageState('REDIRECTING');
  };

  useEffect(() => {
    if (pageState === 'REDIRECTING') {
      router.push(redirectPath);
      // We use a timeout to give the toast message time to be seen before the page unloads
      const timer = setTimeout(() => router.refresh(), 200); 
      return () => clearTimeout(timer);
    }
  }, [pageState, redirectPath, router]);


  if (!phone) {
    return (
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader><CardTitle>خطا</CardTitle></CardHeader>
        <CardContent>
          <p className="text-destructive">شماره تلفنی برای تایید یافت نشد.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">بازگشت به ورود</Button>
        </CardContent>
      </Card>
    );
  }
  
  if (pageState === 'REDIRECTING') {
     return <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> در حال هدایت شما...</div>;
  }

  if (pageState === 'REGISTER') {
    return <RegistrationForm onComplete={handleRegistrationComplete} />;
  }

  return <VerifyOTPForm phone={phone} onVerified={handleVerification} />;
}

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Suspense fallback={<div className="flex items-center gap-2"><Loader2 className="animate-spin" /> در حال بارگذاری...</div>}>
        <VerifyPageContent />
      </Suspense>
    </div>
  );
}
