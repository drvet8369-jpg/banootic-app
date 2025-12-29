
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

// --- Schema ---
const OTPSchema = z.object({
  pin: z.string().min(6, {
    message: "کد تایید باید ۶ رقم باشد.",
  }),
});

interface DebugInfo {
    status: 'Success' | 'Error';
    supabaseError: string | null;
    cookies: string;
    session: object | null;
    profileQueryResult: object | null;
    profileQueryError: string | null;
}

function VerifyOTPForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get('phone');
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    
    const supabase = createClient();

    const otpForm = useForm<z.infer<typeof OTPSchema>>({
        resolver: zodResolver(OTPSchema),
        defaultValues: { pin: "" },
    });

    async function onOTPSubmit(data: z.infer<typeof OTPSchema>) {
        setIsLoading(true);
        toast.loading("در حال تایید کد...");

        if (!phone) {
            toast.error("خطای داخلی: شماره تلفن یافت نشد.");
            setIsLoading(false);
            return;
        }

        const normalizedPhone = normalizeForSupabaseAuth(phone);
        const { data: authData, error: authError } = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token: data.pin,
            type: 'sms',
        });
        
        toast.dismiss();

        let profileData = null;
        let profileError = null;

        if (authError || !authData.session) {
             setDebugInfo({
                status: 'Error',
                supabaseError: authError?.message || "Session not found.",
                cookies: document.cookie,
                session: authData?.session ?? null,
                profileQueryResult: null,
                profileQueryError: null,
            });
        } else {
            // If OTP is correct, immediately query the profile
            const { data: fetchedProfile, error: fetchedProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.session.user.id)
                .single();
            
            profileData = fetchedProfile;
            profileError = fetchedProfileError;

            setDebugInfo({
                status: 'Success',
                supabaseError: null,
                cookies: document.cookie,
                session: authData.session,
                profileQueryResult: profileData,
                profileQueryError: profileError?.message ?? null,
            });
        }
        
        setIsLoading(false);
    }
    
    if (debugInfo) {
        return (
             <Card className="mx-auto max-w-2xl w-full">
                <CardHeader>
                    <CardTitle className="text-xl font-headline">گزارش اشکال‌زدایی (Debug Report)</CardTitle>
                    <CardDescription>این اطلاعات به ما کمک می‌کند مشکل را پیدا کنیم.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm" style={{ direction: 'ltr', textAlign: 'left' }}>
                    <div>
                        <h3 className="font-bold text-base mb-1">1. Verification Status:</h3>
                        <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap">{debugInfo.status}</pre>
                    </div>
                     <div>
                        <h3 className="font-bold text-base mb-1">2. Supabase Auth Error:</h3>
                        <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap">{debugInfo.supabaseError || 'No error.'}</pre>
                    </div>
                     <div>
                        <h3 className="font-bold text-base mb-1">3. Browser Cookies:</h3>
                        <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap">{debugInfo.cookies || 'No cookies found.'}</pre>
                    </div>
                    <div>
                        <h3 className="font-bold text-base mb-1">4. Received Session:</h3>
                        <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap max-h-40 overflow-auto">{JSON.stringify(debugInfo.session, null, 2)}</pre>
                    </div>
                    <div>
                        <h3 className="font-bold text-base mb-1">5. Profile Query Result:</h3>
                        <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap">{JSON.stringify(debugInfo.profileQueryResult, null, 2) || 'No profile found.'}</pre>
                    </div>
                    <div>
                        <h3 className="font-bold text-base mb-1">6. Profile Query Error:</h3>
                        <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre-wrap">{debugInfo.profileQueryError || 'No error.'}</pre>
                    </div>
                     <Button onClick={() => router.push('/')} className="mt-4 w-full">
                        ادامه به صفحه اصلی (برای تست)
                    </Button>
                </CardContent>
             </Card>
        );
    }

    if (!phone) {
        return (
            <Card className="mx-auto max-w-sm w-full text-center">
                 <CardHeader> <CardTitle>خطا</CardTitle> </CardHeader>
                <CardContent>
                    <p className="text-destructive">شماره تلفنی برای تایید یافت نشد.</p>
                     <Button onClick={() => router.push('/login')} className="mt-4">بازگشت به ورود</Button>
                </CardContent>
            </Card>
        )
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
                        <FormField
                            control={otpForm.control}
                            name="pin"
                            render={({ field }) => (
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
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تایید کد
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
            <Suspense fallback={<div className="flex items-center gap-2"><Loader2 className="animate-spin" /> در حال بارگذاری...</div>}>
                <VerifyOTPForm />
            </Suspense>
        </div>
    )

    