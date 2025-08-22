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
import { loginUser } from '@/lib/api';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const formSchema = z.object({
  phone: z.string().min(10, {
    message: 'لطفاً یک شماره تلفن معتبر وارد کنید.',
  }).max(14, {
    message: 'لطفاً یک شماره تلفن معتبر وارد کنید.',
  }),
  accountType: z.enum(['customer', 'provider'], {
    required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.',
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
      accountType: 'customer',
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
        const result = await loginUser(normalizedPhone, values.accountType);

        if (result.success && result.user) {
            login(result.user as User);
            toast({
              title: 'ورود با موفقیت انجام شد!',
              description: `خوش آمدید ${result.user.name}!`,
            });
            const destination = result.user.accountType === 'provider' ? '/profile' : '/';
            router.push(destination);
        } else {
             toast({
                title: 'خطا در ورود',
                description: result.message || 'کاربر یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
                variant: 'destructive',
            });
        }
    } catch (error) {
        console.error("Login failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'مشکلی در ارتباط با سرور پیش آمده است.';
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
          <CardTitle className="text-2xl font-headline">ورود</CardTitle>
          <CardDescription>
            برای ورود به حساب کاربری، شماره تلفن و نوع حساب خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>نوع حساب کاربری:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                        dir="rtl"
                        disabled={isLoading}
                      >
                        <FormItem className="flex items-center space-x-2 space-x-reverse space-y-0">
                          <FormControl>
                            <RadioGroupItem value="customer" id="customer-login" />
                          </FormControl>
                          <FormLabel htmlFor="customer-login" className="font-normal cursor-pointer">
                           مشتری
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-x-reverse space-y-0">
                          <FormControl>
                            <RadioGroupItem value="provider" id="provider-login" />
                          </FormControl>
                          <FormLabel htmlFor="provider-login" className="font-normal cursor-pointer">
                            هنرمند
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
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
              ایجاد حساب جدید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
