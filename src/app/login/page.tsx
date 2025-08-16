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
import { getProviders } from '@/lib/data';
import type { User } from '@/context/AuthContext';


const formSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});

// Helper to get stored customers, returns an empty array if none exist.
const getCustomers = (): User[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem('banotic-customers');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}


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
        
        const allProviders = getProviders();
        const existingProvider = allProviders.find(p => p.phone === values.phone);

        let userToLogin: User;

        if (existingProvider) {
          // User is a known provider
          userToLogin = {
            name: existingProvider.name,
            phone: existingProvider.phone,
            accountType: 'provider',
          };
        } else {
          // Check if the user is a known customer
          const allCustomers = getCustomers();
          const existingCustomer = allCustomers.find(c => c.phone === values.phone);
          
          if (existingCustomer) {
             userToLogin = existingCustomer;
          } else {
             // User is a completely new customer
            userToLogin = {
                name: `کاربر ${values.phone.slice(-4)}`,
                phone: values.phone,
                accountType: 'customer',
            };
          }
        }
        
        login(userToLogin);

        toast({
          title: 'ورود با موفقیت انجام شد!',
          description: `خوش آمدید ${userToLogin.name}! به صفحه اصلی هدایت می‌شوید.`,
        });
        
        router.push('/');

    } catch (error) {
        console.error("Login failed:", error);
        toast({
            title: 'خطا در ورود',
            description: 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.',
            variant: 'destructive'
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12 md:py-20">
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
                      <Input placeholder="09..." {...field} disabled={isLoading} className="text-left dir-ltr placeholder:text-foreground/80" />
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
