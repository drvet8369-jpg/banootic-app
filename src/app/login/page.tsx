
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

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

const formSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLinkSent(false);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: values.phone }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'مشکلی در ارسال لینک ورود پیش آمد.');
        }

        toast({
          title: 'لینک ارسال شد',
          description: `لینک ورود به شماره ${values.phone} ارسال شد. لطفاً کنسول سرور را برای مشاهده لینک چک کنید.`,
        });
        setLinkSent(true);

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

  if (linkSent) {
      return (
        <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
            <Card className="mx-auto max-w-sm w-full text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-headline mt-4">لینک ورود ارسال شد</CardTitle>
                    <CardDescription>
                       ما یک لینک ورود امن به کنسول سرور ارسال کردیم (چون سرویس پیامک فعال نیست). لطفاً روی آن کلیک کرده تا وارد حساب خود شوید.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setLinkSent(false)} variant="outline" className="w-full">
                        ارسال مجدد یا استفاده از شماره دیگر
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
  }


  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود، شماره تلفن خود را وارد کنید تا لینک جادویی برایتان ارسال شود.
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
