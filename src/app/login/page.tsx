'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
import { requestOtp } from './actions';

// This schema is intentionally lenient. It just checks for common patterns.
// The robust validation and normalization happens on the server in the action.
const LoginSchema = z.object({
  phone: z.string().min(10, {
    message: 'شماره تلفن باید حداقل ۱۰ رقم باشد.',
  }).max(14, {
      message: 'شماره تلفن نمی‌تواند بیشتر از ۱۴ کاراکتر باشد.'
  }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('phone', values.phone);

    try {
      // The server action now holds the primary responsibility for validation.
      const result = await requestOtp(formData);
      if (result?.error) {
          toast.error('خطا در ارسال کد', { description: result.error });
      }
      // On success, the action handles the redirect itself.
    } catch (e: any) {
        toast.error('خطای پیش‌بینی نشده', { description: e.message || "لطفاً دوباره تلاش کنید." });
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
                          placeholder="مثال: 09123456789" 
                          {...field}
                          disabled={isLoading}
                          dir="ltr"
                          className="text-center"
                        />
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
        </CardContent>
      </Card>
    </div>
  );
}
