'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  accountType: z.enum(['customer', 'provider'], {
    required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.',
  }),
  name: z.string().min(2, { message: 'نام باید حداقل ۲ حرف داشته باشد.' }),
  email: z.string().email({ message: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' }),
  phone: z.string().regex(/^09\d{9}$/, { message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).' }),
  serviceType: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.serviceType;
    }
    return true;
}, {
    message: 'لطفاً نوع خدمات را انتخاب کنید.',
    path: ['serviceType'],
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.bio && data.bio.length >= 10;
    }
    return true;
}, {
    message: 'بیوگرافی باید حداقل ۱۰ کاراکتر باشد.',
    path: ['bio'],
});

type UserRegistrationInput = z.infer<typeof formSchema>;

export default function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<UserRegistrationInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      accountType: 'customer',
      bio: '',
    },
  });

  const accountType = form.watch('accountType');

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: `password_${Date.now()}`, // Dummy password
        options: {
          // This will be used in the auth callback page to redirect the user.
          emailRedirectTo: `http://localhost:9002/auth/callback`,
          data: {
            name: values.name,
            account_type: values.accountType,
            phone: values.phone,
            service: values.accountType === 'provider' ? (categories.find(c => c.slug === values.serviceType)?.name || 'خدمت جدید') : undefined,
            location: values.accountType === 'provider' ? 'ارومیه' : undefined,
            bio: values.accountType === 'provider' ? values.bio : undefined,
            category_slug: values.accountType === 'provider' ? values.serviceType : undefined,
            service_slug: values.accountType === 'provider' ? values.serviceType : undefined, // Simplified for now
          }
        }
      });
      
      if (authError) throw authError;

      if (!authData.user) throw new Error("کاربر ایجاد نشد، لطفاً دوباره تلاش کنید.");
      
      toast({
        title: 'ثبت‌نام شما موفقیت‌آمیز بود',
        description: 'یک ایمیل برای تأیید حساب کاربری برای شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.',
        duration: 10000,
      });
      
      // Redirect to login page after successful registration
      router.push('/login');

    } catch (error: any) {
      console.error("Registration Error:", error);
      let errorMessage = "مشکلی در فرآیند ثبت‌نام پیش آمده است.";
      if (error.message.includes('User already registered')) {
        errorMessage = 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.';
      }
      toast({
        title: "خطا در ثبت‌نام",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>نوع حساب کاربری خود را انتخاب کنید:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isLoading}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="customer" />
                        </FormControl>
                        <FormLabel className="font-normal">
                         مشتری هستم (برای یافتن و رزرو خدمات)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="provider" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          ارائه‌دهنده خدمات هستم (برای ارائه هنر و تخصص خود)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام کامل یا نام کسب‌وکار</FormLabel>
                  <FormControl>
                    <Input placeholder={accountType === 'provider' ? "مثال: سالن زیبایی سارا" : "نام و نام خانوادگی"} {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس ایمیل</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} disabled={isLoading} dir="ltr" />
                  </FormControl>
                  <FormDescription>
                    برای ورود و خروج از این ایمیل استفاده خواهید کرد.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شماره تلفن (برای تماس)</FormLabel>
                  <FormControl>
                    <Input placeholder="09123456789" {...field} disabled={isLoading} dir="ltr"/>
                  </FormControl>
                  <FormDescription>
                    این شماره در پروفایل شما برای تماس مشتریان نمایش داده می‌شود.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {accountType === 'provider' && (
              <>
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع خدمات</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک دسته‌بندی خدمات انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بیوگرافی کوتاه</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="کمی در مورد خدمات و هنر خود به ما بگویید"
                          className="resize-none"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        توضیح مختصری درباره آنچه ارائه می‌دهید (حداقل ۱۰ کاراکتر).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ثبت‌نام
            </Button>
            
            <div className="mt-4 text-center text-sm">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <Link href="/login" className="underline">
                وارد شوید
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
