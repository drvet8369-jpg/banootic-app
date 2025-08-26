
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
import { getUserByPhone } from '@/lib/api';
import type { AppUser } from '@/context/AuthContext';


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
        const foundUser = await getUserByPhone(values.phone);

        if (foundUser) {
            const userToLogin: AppUser = {
                id: foundUser.user_id,
                name: foundUser.name,
                phone: foundUser.phone,
                accountType: foundUser.account_type,
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
                description: 'کاربری با این شماره تلفن ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید.',
                variant: 'destructive'
            });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.';
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
    <div className="flex items-center justify-center py-12 md:py-20">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود، شماره تلفن خود را وارد کنید.
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
                      <Input placeholder="09XXXXXXXXX" {...field} disabled={isLoading} />
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
