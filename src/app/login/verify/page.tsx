
'use client';

import { Suspense } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
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


const OTPSchema = z.object({
  pin: z.string().min(6, {
    message: "کد تایید باید ۶ رقم باشد.",
  }),
});

function VerifyOTPForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get('phone');
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<z.infer<typeof OTPSchema>>({
        resolver: zodResolver(OTPSchema),
        defaultValues: {
            pin: "",
        },
    });

    async function onSubmit(data: z.infer<typeof OTPSchema>) {
        setIsLoading(true);
        const toastId = toast.loading("۱. در حال تایید کد...", { description: "لطفاً چند لحظه صبر کنید..." });

        if (!phone) {
            toast.error("خطای داخلی", { id: toastId, description: "شماره تلفن در آدرس صفحه یافت نشد.", duration: 10000 });
            setIsLoading(false);
            return;
        }

        try {
            const normalizedPhone = normalizeForSupabaseAuth(phone);
            const token = data.pin;

            // گام ۱: نمایش اطلاعات ارسالی
            toast.info("۲. اطلاعات در حال ارسال به سرور", {
                id: toastId,
                description: `شماره نرمال‌شده: ${normalizedPhone}\nکد وارد شده: ${token}`,
                duration: 20000,
            });

            // گام ۲: فراخوانی تابع تایید
            const { data: authData, error } = await supabase.auth.verifyOtp({
                phone: normalizedPhone,
                token: token,
                type: 'sms',
            });
            
            // گام ۳: بررسی دقیق نتیجه
            if (error) {
                // اگر خطا وجود داشت، آن را نمایش بده
                toast.error("۳. Supabase: خطا در تایید کد", { 
                    id: toastId,
                    description: `متن خطا: ${error.message}. کد وارد شده صحیح نیست یا منقضی شده.`,
                    duration: 30000, // زمان بیشتر برای خواندن خطا
                });
                setIsLoading(false);
                return; // اجرای تابع را متوقف کن
            }
            
            // گام ۴: بررسی وجود جلسه کاربری
            if (authData && authData.session) {
                toast.success("۴. تایید موفقیت‌آمیز!", { 
                    id: toastId,
                    description: "جلسه کاربری با موفقیت ایجاد شد. در حال هدایت...",
                    duration: 10000,
                });
                
                // رفرش کامل صفحه برای همگام‌سازی جلسه با سرور
                window.location.href = `/register?phone=${phone}`;

            } else {
                 // این حالت یعنی تایید موفق بود اما جلسه‌ای ساخته نشد (خیلی نادر)
                 toast.warning("۵. تایید موفق بود اما جلسه ایجاد نشد!", {
                     id: toastId,
                     description: "این یک خطای غیرمنتظره است. لطفاً برای بررسی بیشتر با پشتیبانی تماس بگیرید.",
                     duration: 30000,
                 });
                 setIsLoading(false);
            }

        } catch (e: any) {
             toast.error("خطای بحرانی در سیستم", { 
              id: toastId,
              description: `یک خطای پیش‌بینی نشده در کلاینت رخ داد: ${e.message}`,
              duration: 30000,
            });
            setIsLoading(false);
        }
    }

    if (!phone) {
        return (
            <Card className="mx-auto max-w-sm w-full text-center">
                 <CardHeader>
                    <CardTitle>خطا</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">شماره تلفنی برای تایید یافت نشد. لطفاً به صفحه ورود بازگردید.</p>
                     <Button onClick={() => router.push('/login')} className="mt-4">بازگشت به ورود</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">تایید شماره تلفن</CardTitle>
                <CardDescription>
                    کد ۶ رقمی ارسال شده به شماره {phone} را وارد کنید.
                </CardDescription>
                 <CardDescription className="pt-2 text-blue-600 font-bold">
                    توجه: در محیط تست، کد تایید ممکن است کمی با تاخیر ارسال شود.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>کد تایید</FormLabel>
                                    <FormControl>
                                        <div className="flex justify-center">
                                            <InputOTP maxLength={6} {...field}>
                                                <InputOTPGroup dir="ltr">
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تایید و ادامه
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}


export default function VerifyPage() {
    return (
        <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
            <Suspense fallback={<div>در حال بارگذاری...</div>}>
                <VerifyOTPForm />
            </Suspense>
        </div>
    )
}
