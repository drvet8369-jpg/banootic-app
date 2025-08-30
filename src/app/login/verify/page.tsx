'use client';

import { Suspense } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useToast } from '@/hooks/use-toast';
import { normalizePhoneNumber } from '@/lib/utils';


const OTPSchema = z.object({
  pin: z.string().min(6, {
    message: "کد تایید باید ۶ رقم باشد.",
  }),
});

function VerifyOTPForm() {
    const { toast } = useToast();
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
            toast({ title: "خطا", description: "شماره تلفن یافت نشد.", variant: "destructive"});
            setIsLoading(false);
            return;
        }

        const normalizedPhone = normalizePhoneNumber(phone);

        const { data: { session }, error } = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token: data.pin,
            type: 'sms',
        });
        
        if (error) {
            toast({ title: 'خطا', description: "کد وارد شده نامعتبر است یا منقضی شده.", variant: 'destructive'});
        } else if (session) {
            toast({ title: 'موفق', description: 'شما با موفقیت وارد شدید!'});
            router.push('/');
            router.refresh(); // Important to re-fetch user data on layout
        }
        setIsLoading(false);
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
                    توجه: در محیط تست، کد تایید همیشه 123456 است.
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
