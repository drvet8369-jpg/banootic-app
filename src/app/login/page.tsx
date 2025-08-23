'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
import { createClient } from '@/lib/supabase/client';
import { normalizePhoneNumber } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const formSchema = z.object({
  phone: z.string().min(10, {
    message: 'لطفاً یک شماره تلفن معتبر وارد کنید.',
  }).max(14, {
    message: 'لطفاً یک شماره تلفن معتبر وارد کنید.',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const phoneForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { phone: '' },
  });

  async function onPhoneSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const normalizedPhone = normalizePhoneNumber(values.phone);
    
    if (!normalizedPhone.match(/^09\d{9}$/)) {
        toast({
            title: 'خطا',
            description: 'فرمت شماره تلفن وارد شده صحیح نیست. مثال: 09123456789',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }
    
    setPhone(normalizedPhone);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
        phone: `+98${normalizedPhone.substring(1)}`, // Convert to international format for Supabase
    });

    if (error) {
        toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'کد ارسال شد', description: 'کد تایید یکبار مصرف به شماره شما ارسال شد.' });
        setStep(2);
    }
    setIsLoading(false);
  }

  async function onOtpSubmit(e: React.FormEvent) {
      e.preventDefault();
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
          phone: `+98${phone.substring(1)}`,
          token: otp,
          type: 'sms',
      });
      
      if (error) {
          toast({ title: 'خطا', description: error.message, variant: 'destructive' });
      } else if (data.session) {
          // AuthContext's onAuthStateChange will handle fetching profile and setting user state.
          // We just need to navigate.
          toast({ title: 'ورود موفق', description: 'شما با موفقیت وارد شدید.' });
          
          // Check if user has a profile, if not, redirect to register
          const { data: profile } = await supabase
            .from('customers')
            .select('id')
            .eq('id', data.user.id)
            .single();

          const { data: providerProfile } = await supabase
            .from('providers')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!profile && !providerProfile) {
              router.push('/register');
          } else {
              router.push('/');
          }
          router.refresh();
      }
      setIsLoading(false);
  }


  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            {step === 1 
                ? 'برای ورود یا ساخت حساب کاربری، شماره تلفن خود را وارد کنید.'
                : 'کد ۶ رقمی ارسال شده به شماره خود را وارد کنید.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
             <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره تلفن</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="09xxxxxxxxx" 
                            {...field} 
                            disabled={isLoading}
                            className="text-left dir-ltr placeholder:text-muted-foreground/70"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    ارسال کد تایید
                  </Button>
                </form>
             </Form>
          ) : (
            <form onSubmit={onOtpSubmit} className="space-y-6">
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center text-2xl tracking-[1em] font-mono"
                    maxLength={6}
                    disabled={isLoading}
                />
                <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6}>
                   {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                   تایید و ورود
                </Button>
                <Button variant="link" onClick={() => setStep(1)} disabled={isLoading} className="w-full">
                    ویرایش شماره تلفن
                </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
