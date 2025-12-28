'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { completeRegisterAction } from './actions';


// --------------------
// Schema
// --------------------
const formSchema = z.object({
  name: z.string().min(3, 'نام حداقل باید ۳ کاراکتر باشد'),
  phone: z.string().min(10),
  accountType: z.enum(['customer', 'provider']),
  bio: z.string().optional(),
  location: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;


// --------------------
// Component
// --------------------
export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromParams = searchParams.get('phone') ?? '';

  const { user, session, loading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: phoneFromParams,
      accountType: 'customer',
      bio: '',
      location: '',
    },
  });

  // --------------------
  // Auth Guard
  // --------------------
  useEffect(() => {
    if (loading) return;

    // اگر هنوز session نیامده → برگرد به لاگین
    if (!session) {
      toast.error('برای ثبت نام ابتدا باید وارد شوید');
      router.replace('/login');
      return;
    }

    // اگر کاربر قبلاً پروفایل داشته → برگرد به خانه
    if (session && user) {
      router.replace('/');
      return;
    }

    // ست کردن شماره از session
    if (session?.user?.phone) {
      form.setValue('phone', session.user.phone);
    }
  }, [loading, session, user, router, form]);

  // --------------------
  // Submit
  // --------------------
  const onSubmit = async (values: FormValues) => {
    try {
      const res = await completeRegisterAction(values);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success('ثبت نام با موفقیت انجام شد');

      // Hard refresh برای sync شدن session
      window.location.href =
        values.accountType === 'provider' ? '/profile' : '/';
    } catch (err) {
      toast.error('خطای غیرمنتظره رخ داد');
    }
  };

  // --------------------
  // UI
  // --------------------
  if (loading) return null;

  if (session && !user) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            تکمیل اطلاعات ثبت‌نام
          </CardTitle>
          <CardDescription>
            فقط چند قدم تا پیوستن به جامعه بانوتیک باقی مانده است.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام و نام خانوادگی</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع حساب</FormLabel>
                    <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">مشتری</SelectItem>
                        <SelectItem value="provider">ارائه‌دهنده خدمات</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شهر</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>درباره شما</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                ثبت نام
              </Button>

            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return null;
}
