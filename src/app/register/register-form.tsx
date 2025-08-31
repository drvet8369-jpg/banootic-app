
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
import { categories, services } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { getUserByPhone } from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/utils';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider'], {
    required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.',
  }),
  name: z.string().min(2, {
    message: 'نام باید حداقل ۲ حرف داشته باشد.',
  }),
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
  serviceType: z.string().optional(),
  serviceSlug: z.string().optional(),
  location: z.string().optional(),
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
        return !!data.serviceSlug;
    }
    return true;
}, {
    message: 'لطفاً خدمت دقیق را انتخاب کنید.',
    path: ['serviceSlug'],
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
      phone: '',
      accountType: 'customer',
      location: 'ارومیه',
      bio: '',
    },
  });

  const accountType = form.watch('accountType');
  const selectedCategorySlug = form.watch('serviceType');

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    
    try {
        const normalizedPhone = normalizePhoneNumber(values.phone);
        const existingUser = await getUserByPhone(normalizedPhone);

        if (existingUser) {
            toast({
                title: 'خطا',
                description: 'این شماره تلفن قبلاً ثبت شده است. لطفاً وارد شوید.',
                variant: 'destructive'
            });
            setIsLoading(false);
            return;
        }
        
        const dummyEmail = `${normalizedPhone}@example.com`;
        
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: dummyEmail,
            password: Math.random().toString(36).slice(-12),
            phone: normalizedPhone,
            options: {
                data: {
                    name: values.name,
                    phone: normalizedPhone,
                    account_type: values.accountType,
                    ...(values.accountType === 'provider' && {
                        service: services.find(s => s.slug === values.serviceSlug)?.name || 'خدمات عمومی',
                        bio: values.bio,
                        category_slug: values.serviceType,
                        service_slug: values.serviceSlug,
                        location: values.location,
                    }),
                }
            }
        });

        if (signUpError) throw signUpError;
        if (!user) throw new Error('ثبت نام موفق نبود، کاربری ایجاد نشد.');
        
        const { error: signInError } = await supabase.auth.signInWithOtp({
            phone: normalizedPhone,
        });

        if (signInError) throw signInError;

        toast({
            title: 'ثبت نام موفقیت آمیز بود!',
            description: 'کد تایید برای شما ارسال شد.',
        });
        
        router.push(`/login/verify?phone=${encodeURIComponent(normalizedPhone)}`);

    } catch (error: any) {
        console.error("Registration failed:", error);
        toast({
            title: 'خطا در ثبت‌نام',
            description: error.message || 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.',
            variant: 'destructive'
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>نوع حساب کاربری خود را انتخاب کنید:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('serviceType', undefined);
                          form.setValue('serviceSlug', undefined);
                          form.clearErrors('serviceType');
                          form.clearErrors('serviceSlug');
                      }}
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شماره تلفن</FormLabel>
                  <FormControl>
                    <Input placeholder="09123456789" {...field} disabled={isLoading} dir="ltr" />
                  </FormControl>
                   <FormDescription>
                    از این شماره برای ورود به حساب کاربری خود استفاده خواهید کرد.
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
                      <FormLabel>دسته‌بندی خدمات</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('serviceSlug', undefined); // Reset specific service on category change
                        }} 
                        defaultValue={field.value} 
                        disabled={isLoading}
                      >
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

                {selectedCategorySlug && (
                    <FormField
                    control={form.control}
                    name="serviceSlug"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>خدمت دقیق</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="نوع دقیق خدمت خود را انتخاب کنید" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {services.filter(s => s.categorySlug === selectedCategorySlug).map((service) => (
                                <SelectItem key={service.slug} value={service.slug}>
                                {service.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مکان</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
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
                        این بیوگرافی در پروفایل عمومی شما نمایش داده می‌شود.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ثبت‌نام و ارسال کد تایید
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

