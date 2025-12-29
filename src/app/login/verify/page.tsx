
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { categories } from '@/lib/constants';
import { completeRegistrationAction } from './actions';
import type { Session } from '@supabase/supabase-js';


// --- Schemas ---
const OTPSchema = z.object({
  pin: z.string().min(6, {
    message: "کد تایید باید ۶ رقم باشد.",
  }),
});

const RegistrationSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ حرف داشته باشد.'),
  accountType: z.enum(['customer', 'provider'], {
    required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.',
  }),
  serviceType: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.serviceType && !!data.bio && data.bio.length >= 10 && !!data.location;
    }
    return true;
}, {
    message: 'برای هنرمندان، انتخاب نوع خدمات، شهر و بیوگرافی (حداقل ۱۰ کاراکتر) الزامی است.',
    path: ['serviceType'], // Show error on a related field
});
type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

// --- Component States ---
type VerificationState = 'enter_otp' | 'submitting_otp' | 'show_registration_form' | 'submitting_registration' | 'error';

function VerifyOTPAndRegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get('phone');
    const [verificationState, setVerificationState] = useState<VerificationState>('enter_otp');
    
    const supabase = createClient();

    // --- OTP Form ---
    const otpForm = useForm<z.infer<typeof OTPSchema>>({
        resolver: zodResolver(OTPSchema),
        defaultValues: { pin: "" },
    });

    // --- Registration Form ---
    const registrationForm = useForm<RegistrationFormValues>({
        resolver: zodResolver(RegistrationSchema),
        defaultValues: {
            name: '',
            accountType: 'customer',
            bio: '',
            location: 'ارومیه', // Default location
        },
    });
    const accountType = registrationForm.watch('accountType');

    // --- Handlers ---
    async function onOTPSubmit(data: z.infer<typeof OTPSchema>) {
        setVerificationState('submitting_otp');
        toast.loading("در حال تایید کد...");

        if (!phone) {
            toast.error("خطای داخلی: شماره تلفن یافت نشد.");
            setVerificationState('error');
            return;
        }

        const normalizedPhone = normalizeForSupabaseAuth(phone);
        const { data: authData, error } = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token: data.pin,
            type: 'sms',
        });

        toast.dismiss();

        if (error || !authData.session) {
            toast.error("خطا در تایید کد", { description: error?.message || "لطفا دوباره تلاش کنید." });
            setVerificationState('enter_otp');
        } else {
            toast.success("کد با موفقیت تایید شد!");
            
            // Check if user profile already exists and is COMPLETE
             const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', authData.session.user.id)
                .single();
            
            if (profile && profile.full_name) {
                // Profile exists and is complete, user is just logging in. Redirect to home.
                toast.info("خوش آمدید! در حال انتقال به صفحه اصلی...");
                window.location.href = '/'; // Hard refresh to sync session everywhere
            } else {
                // New user or incomplete profile, show registration form
                setVerificationState('show_registration_form');
            }
        }
    }
    
    async function onRegistrationSubmit(values: RegistrationFormValues) {
        setVerificationState('submitting_registration');
        toast.loading("در حال تکمیل ثبت‌نام...");

        const result = await completeRegistrationAction(values);

        toast.dismiss();

        if (result.error) {
            toast.error("خطا در ثبت‌نام", { description: result.error });
            setVerificationState('show_registration_form');
        } else {
            toast.success("ثبت‌نام با موفقیت انجام شد!");
            // Hard refresh to ensure session is fully synced across the app
            window.location.href = result.redirectPath || '/';
        }
    }


    // --- Renders ---
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

    if (verificationState === 'enter_otp' || verificationState === 'submitting_otp') {
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
                            <Button type="submit" className="w-full" disabled={verificationState === 'submitting_otp'}>
                                {verificationState === 'submitting_otp' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                تایید کد
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        );
    }
    
    if (verificationState === 'show_registration_form' || verificationState === 'submitting_registration') {
         return (
            <Card className="w-full max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">تکمیل اطلاعات ثبت‌نام</CardTitle>
                    <CardDescription>فقط چند قدم تا پیوستن به جامعه بانوتیک باقی مانده است.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...registrationForm}>
                        <form onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)} className="space-y-6">
                             <FormField
                              control={registrationForm.control}
                              name="accountType"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel>نوع حساب کاربری خود را انتخاب کنید:</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-col space-y-1"
                                      disabled={verificationState === 'submitting_registration'}
                                    >
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="customer" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                         مشتری هستم (برای یافتن و رزرو خدمات)
                                        </FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="provider" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          هنرمند هستم (برای ارائه هنر و تخصص خود)
                                        </FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                                control={registrationForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>نام کامل یا نام کسب‌وکار</FormLabel>
                                        <FormControl>
                                            <Input placeholder={accountType === 'provider' ? "مثال: سالن زیبایی سارا" : "نام و نام خانوادگی"} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {accountType === 'provider' && (
                                <>
                                    <FormField
                                        control={registrationForm.control}
                                        name="serviceType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>دسته‌بندی اصلی خدمات</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="یک دسته‌بندی انتخاب کنید" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map((cat) => <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registrationForm.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>شهر</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={registrationForm.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>درباره شما و هنرتان (بیوگرافی)</FormLabel>
                                                <FormControl><Textarea placeholder="کمی در مورد خود و خدماتی که ارائه می‌دهید توضیح دهید..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                            <Button type="submit" className="w-full" size="lg" disabled={verificationState === 'submitting_registration'}>
                                {verificationState === 'submitting_registration' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                تکمیل ثبت‌نام و ورود
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        );
    }
    
    return null; // Fallback for error state or unexpected states
}


export default function VerifyPage() {
    return (
        <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
            <Suspense fallback={<div className="flex items-center gap-2"><Loader2 className="animate-spin" /> در حال بارگذاری...</div>}>
                <VerifyOTPAndRegisterForm />
            </Suspense>
        </div>
    )
}
