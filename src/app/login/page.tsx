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
import { getUserByPhone } from '@/lib/api';

const formSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        // Check if user exists first
        const userExists = await getUserByPhone(values.phone);
        if (!userExists) {
            toast({
                title: 'کاربر یافت نشد',
                description: 'کاربری با این شماره تلفن ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید.',
                variant: 'destructive'
            });
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            phone: values.phone,
        });

        if (error) throw error;

        toast({
            title: 'کد تایید ارسال شد',
            description: 'یک کد تایید ۶ رقمی به شماره شما ارسال شد.',
        });
        
        router.push(`/login/verify?phone=${values.phone}`);

    } catch (error: any) {
        console.error("Login error:", error);
        toast({
            title: 'خطا در ورود',
            description: 'مشکلی در ارسال کد تایید پیش آمده است. لطفاً دوباره تلاش کنید.',
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
          <CardTitle className="text-2xl font-headline">ورود به حساب کاربری</CardTitle>
          <CardDescription>
            برای ورود، شماره تلفن خود را وارد کنید تا کد تایید برایتان ارسال شود.
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
                      <Input placeholder="09123456789" {...field} disabled={isLoading} dir="ltr" className="text-center" />
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
