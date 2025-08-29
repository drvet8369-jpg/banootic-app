
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

const emailSchema = z.object({
  email: z.string().email({
    message: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
         throw error;
      }
      
      toast({
        title: 'لینک ورود ارسال شد',
        description: 'یک ایمیل حاوی لینک ورود برای شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.',
        duration: 10000,
      });

      form.reset();

    } catch (error: any) {
        console.error("Login error:", error);
        let errorMessage = 'مشکلی در ارسال لینک ورود پیش آمده است. لطفاً دوباره تلاش کنید.';
        if (error.message.includes('User not found') || error.message.includes('for an existing user')) {
            errorMessage = 'کاربری با این ایمیل یافت نشد. لطفاً ابتدا ثبت‌نام کنید.'
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
          <CardTitle className="text-2xl font-headline">ورود به حساب کاربری</CardTitle>
          <CardDescription>
            برای ورود، ایمیل خود را وارد کنید تا لینک جادویی برایتان ارسال شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>آدرس ایمیل</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} disabled={isLoading} dir="ltr" className="text-center" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ارسال لینک ورود
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
