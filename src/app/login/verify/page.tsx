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
        if (!phone) {
            toast.error("خطا", { description: "شماره تلفن یافت نشد."});
            setIsLoading(false);
            return;
        }

        try {
            const normalizedPhone = normalizeForSupabaseAuth(phone);
            
            const { data: authData, error } = await supabase.auth.verifyOtp({
                phone: normalizedPhone,
                token: data.pin,
                type: 'sms',
            });

            if (error) {
                console.error("Supabase verifyOtp Error:", error);
                toast.error('خطا در تایید', { description: `کد تایید نامعتبر است: ${error.message}` });
                setIsLoading(false);
                return;
            }
            
            // On successful verification, Supabase client library automatically handles the session.
            // Now, let's check if the user has a complete profile.
             if (authData.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, account_type')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
                     toast.error('خطا در بررسی پروفایل', { description: profileError.message });
                     setIsLoading(false);
                     return;
                }
                
                // If profile exists and is complete, redirect them.
                if (profile?.full_name) {
                    router.push(profile.account_type === 'provider' ? '/profile' : '/');
                } else {
                    // Otherwise, send them to complete registration.
                    router.push(`/register?phone=${phone}`);
                }
            } else {
                 // Fallback to registration page if user data is somehow missing
                 router.push(`/register?phone=${phone}`);
            }

        } catch (e: any) {
            toast.error("خطای پیش‌بینی نشده", { description: e.message || "لطفاً دوباره تلاش کنید." });
            setIsLoading(false);
        }
        // setLoading is handled in each branch.
    }

    if (!phone) {
        return (
            <Card className="mx-auto max-w-sm w-full text-center">
                 <CardHeader>
                    <CardTitle>خطا</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">شماره تلفنی برای تایید یافت نشد. لطفاً به صفحه ورود بازگردید.</p>
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
