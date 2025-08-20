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
import { getProviderByPhone, getCustomerByPhone } from '@/lib/api';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from '@/lib/utils';


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

    try {
        let userToLogin: User | null = null;
        
        // Step 1: Check if the user is a provider
        const existingProvider = await getProviderByPhone(normalizedPhone);

        if (existingProvider) {
            userToLogin = {
                name: existingProvider.name,
                phone: existingProvider.phone,
                accountType: 'provider',
            };
        } else {
            // Step 2: If not a provider, check if they are a customer
            const existingCustomer = await getCustomerByPhone(normalizedPhone);
            if (existingCustomer) {
                userToLogin = existingCustomer;
            }
        }
        
        // Step 3: Final decision based on whether a user was found
        if (userToLogin) {
            login(userToLogin);

            toast({
              title: 'ورود با موفقیت انجام شد!',
              description: `خوش آمدید ${userToLogin.name}!`,
            });
            
            const destination = userToLogin.accountType === 'provider' ? '/profile' : '/';
            router.push(destination);
        } else {
            // User was not found in either table
            toast({
                title: 'کاربر یافت نشد',
                description: 'این شماره تلفن در سیستم ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید.',
                variant: 'destructive',
            });
        }

    } catch (error) {
        console.error("Login failed:", error);
        toast({
            title: 'خطا در ورود',
            description: 'مشکلی در ارتباط با سرور پیش آمده است، لطفاً دوباره تلاش کنید.',
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
          <CardTitle className="text-2xl font-headline">ورود به حساب کاربری</CardTitle>
          <CardDescription>
             شماره تلفن خود را برای ورود وارد کنید.
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
            حساب کاربری ندارید؟{" "}
            <Link href="/register" className="underline">
              از اینجا ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
