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
import { getProviderByPhone, createCustomer, getCustomerByPhone } from '@/lib/api';
import type { User } from '@/context/AuthContext';


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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let userToLogin: User | null = null;
        
        // 1. Check if the user is a registered provider
        const existingProvider = await getProviderByPhone(values.phone);
        if (existingProvider) {
          userToLogin = {
            name: existingProvider.name,
            phone: existingProvider.phone,
            accountType: 'provider',
          };
        } else {
            // 2. If not a provider, check if they are an existing customer
            const existingCustomer = await getCustomerByPhone(values.phone);
            if(existingCustomer) {
                userToLogin = existingCustomer;
            } else {
                 // 3. Only if they are neither a provider nor a customer, create a new customer
                const newCustomer = await createCustomer({
                    name: `کاربر ${values.phone.slice(-4)}`,
                    phone: values.phone,
                });
                userToLogin = newCustomer;
            }
        }
        
        if (!userToLogin) {
            throw new Error("Could not log in or create user.");
        }

        login(userToLogin);

        toast({
          title: 'ورود با موفقیت انجام شد!',
          description: `خوش آمدید ${userToLogin.name}!`,
        });
        
        router.push('/');

    } catch (error) {
        console.error("Login failed:", error);
        let errorMessage = 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.';
        if (error instanceof Error && error.message.includes('already registered')) {
            errorMessage = 'این شماره تلفن قبلاً ثبت شده است. لطفاً برای ثبت نام به عنوان نوع کاربری دیگر، از شماره دیگری استفاده کنید.'
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
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود یا ساخت حساب کاربری، شماره تلفن خود را وارد کنید.
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
                ورود
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            هنرمند هستید؟{" "}
            <Link href="/register" className="underline">
              از اینجا ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
