
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
        
        // Step 1: Check if the user is a provider
        const { data: provider, error: providerError } = await supabase
            .from('providers')
            .select('user_id, name, phone')
            .eq('phone', normalizedPhone)
            .single();

        if (provider) {
            const userToLogin: AppUser = {
                id: provider.user_id,
                name: provider.name,
                phone: provider.phone,
                account_type: 'provider',
            };
            login(userToLogin);
            toast({ title: 'ورود موفق', description: `خوش آمدید هنرمند عزیز، ${userToLogin.name}!` });
            router.push('/profile');
            return;
        }

        // Handle errors other than "not found"
        if (providerError && providerError.code !== 'PGRST116') throw providerError;

        // Step 2: If not a provider, check if the user is a customer
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('user_id, name, phone')
            .eq('phone', normalizedPhone)
            .single();
        
        if (customer) {
             const userToLogin: AppUser = {
                id: customer.user_id,
                name: customer.name,
                phone: customer.phone,
                account_type: 'customer',
            };
            login(userToLogin);
            toast({ title: 'ورود موفق', description: `خوش آمدید ${userToLogin.name}!` });
            router.push('/');
            return;
        }

        if (customerError && customerError.code !== 'PGRST116') throw customerError;

        // Step 3: If user is in neither table, they need to register
        toast({
            title: 'کاربر یافت نشد',
            description: 'شماره تلفن شما در سیستم ثبت نشده است. لطفاً ثبت‌نام کنید.',
            variant: 'destructive',
        });

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
