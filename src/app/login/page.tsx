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
import { useAuth } from '@/context/AuthContext';
import type { AppUser } from '@/context/AuthContext';
import { normalizePhoneNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';


const formSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();
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
        const normalizedPhone = normalizePhoneNumber(values.phone);
        
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', normalizedPhone)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an actual db error
            throw error;
        }
        
        if (user) {
            const userToLogin: AppUser = {
                id: user.id,
                name: user.name,
                phone: user.phone,
                accountType: user.account_type as 'provider' | 'customer',
            };
            login(userToLogin);
            toast({
              title: 'ورود با موفقیت انجام شد!',
              description: `خوش آمدید ${userToLogin.name}!`,
            });
            
            const destination = userToLogin.accountType === 'provider' ? '/profile' : '/';
            router.push(destination);

        } else {
             toast({
                title: 'کاربر یافت نشد',
                description: 'شماره تلفن شما در سیستم ثبت نشده است. لطفاً ثبت‌نام کنید.',
                variant: 'destructive',
            });
        }

    } catch (error) {
        const err = error as Error;
        console.error("Login failed:", err);
        toast({
            title: 'خطا در ورود',
            description: err.message || 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.',
            variant: 'destructive'
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود</CardTitle>
          <CardDescription>
            برای ورود به حساب کاربری، شماره تلفن خود را وارد کنید.
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
                      <Input placeholder="09123456789" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ورود
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            هنوز ثبت‌نام نکرده‌اید؟{" "}
            <Link href="/register" className="underline">
              ایجاد حساب کاربری
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
