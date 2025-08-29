
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

const phoneSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof phoneSchema>) {
    setIsLoading(true);

    try {
      // This is the standard Supabase client-side OTP flow.
      // With the dashboard configured for test OTPs, it will not send a real SMS.
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: values.phone,
        options: {
          // This is crucial. It tells Supabase to not create a new user
          // if they don't exist. This is the correct behavior for a login page.
          shouldCreateUser: false,
        }
      });

      if (error) {
         throw error;
      }
      
      toast({
        title: 'کد تایید آماده است',
        description: 'به صفحه تایید کد هدایت می‌شوید. در محیط تست، از کد 123456 استفاده کنید.',
      });
      
      router.push(`/login/verify?phone=${encodeURIComponent(values.phone)}`);

    } catch (error: any) {
        let errorMessage = 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.';
        if (error.message.includes('User not found')) {
            errorMessage = 'کاربری با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید.'
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.'
        }
        
        toast({
            title: 'خطا در ورود',
            description: errorMessage,
            variant: 'destructive'
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <KeyRound className="w-10 h-10 text-primary" />
            </div>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود، شماره تلفن خود را وارد کنید تا به صفحه تایید کد هدایت شوید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="09XXXXXXXXX" {...field} disabled={isLoading} dir="ltr" className="text-center" />
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
          <div className="mt-4 text-center text-sm">
            حساب کاربری ندارید؟{" "}
            <Link href="/register" className="underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
