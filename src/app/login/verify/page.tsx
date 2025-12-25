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
        toast.info("در حال تایید کد...", { description: "لطفاً چند لحظه صبر کنید..." });

        if (!phone) {
            toast.error("خطا", { description: "شماره تلفن یافت نشد."});
            setIsLoading(false);
            return;
        }

        try {
            const normalizedPhone = normalizeForSupabaseAuth(phone);
            const token = data.pin;

            console.log("--- DEBUG: Attempting to verify OTP ---");
            console.log("Phone (normalized):", normalizedPhone);
            console.log("Token (PIN):", token);

            const { data: authData, error } = await supabase.auth.verifyOtp({
                phone: normalizedPhone,
                token: token,
                type: 'sms',
            });
            
            console.log("--- DEBUG: Supabase verifyOtp Response ---");
            console.log("Data:", authData);
            console.log("Error:", error);

            // Display the full response in a toast for debugging
            const responseDataString = JSON.stringify(authData, null, 2);
            const responseErrorString = JSON.stringify(error, null, 2);

            if (error) {
                toast.error("خطای Supabase در تایید کد", { 
                    description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 text-white text-left" dir="ltr">{responseErrorString}</pre>,
                    duration: 20000, // Keep toast open longer
                });
                setIsLoading(false);
                return;
            }
            
            if (authData && (authData.user || authData.session)) {
                 toast.success("تایید موفقیت‌آمیز!", { 
                    description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 text-white text-left" dir="ltr">{responseDataString}</pre>,
                    duration: 20000,
                });
                
                // Temporarily disable redirect to see the toast message
                // window.location.href = `/register?phone=${phone}`;

            } else {
                 toast.warning("پاسخ موفقیت آمیز بود اما session یا user وجود ندارد!", {
                     description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 text-white text-left" dir="ltr">{responseDataString}</pre>,
                     duration: 20000,
                 });
            }

        } catch (e: any) {
            const catchErrorString = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
            toast.error("خطای پیش‌بینی نشده در بلوک try/catch", { 
              description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 text-white text-left" dir="ltr">{catchErrorString}</pre>,
              duration: 20000,
            });
        } finally {
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
