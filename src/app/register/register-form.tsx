'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
import { getCategories, getServicesByCategory } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import type { Category, Service } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { normalizePhoneNumber } from '@/lib/utils';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider'], {
    required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.',
  }),
  fullName: z.string().min(2, {
    message: 'نام باید حداقل ۲ حرف داشته باشد.',
  }),
  phone: z.string().refine(phone => {
      const normalized = normalizePhoneNumber(phone);
      return /^09\d{9}$/.test(normalized);
  }, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
  categoryId: z.string().optional(),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.categoryId;
    }
    return true;
}, {
    message: 'لطفاً دسته‌بندی خدمات را انتخاب کنید.',
    path: ['categoryId'],
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.serviceId;
    }
    return true;
}, {
    message: 'لطفاً نوع خدمات را انتخاب کنید.',
    path: ['serviceId'],
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const supabase = createClient();

  useEffect(() => {
      const fetchCategories = async () => {
          const cats = await getCategories();
          setCategories(cats);
      }
      fetchCategories();
  }, []);

  const form = useForm<UserRegistrationInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      accountType: 'customer',
      bio: '',
    },
  });

  const accountType = form.watch('accountType');
  const categoryId = form.watch('categoryId');

  useEffect(() => {
      const fetchServices = async () => {
          if (categoryId) {
              const selectedCategory = categories.find(c => c.id.toString() === categoryId);
              if (selectedCategory) {
                const srvs = await getServicesByCategory(selectedCategory.slug);
                setServices(srvs);
                form.setValue('serviceId', undefined); // Reset service selection
              }
          } else {
              setServices([]);
          }
      }
      fetchServices();
  }, [categoryId, categories, form]);

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    
    const normalizedPhone = normalizePhoneNumber(values.phone);
    const password = process.env.NEXT_PUBLIC_SUPABASE_MASTER_PASSWORD;
    if(!password){
        toast.error('خطای پیکربندی', { description: 'رمز اصلی برنامه یافت نشد.'});
        setIsLoading(false);
        return;
    }
    
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      phone: normalizedPhone,
      password: password,
      options: {
        data: {
          full_name: values.fullName,
          account_type: values.accountType,
          ...(values.accountType === 'provider' && {
              category_id: values.categoryId ? parseInt(values.categoryId) : null,
              service_id: values.serviceId ? parseInt(values.serviceId) : null,
              bio: values.bio,
              location: 'ارومیه',
          }),
        },
      },
    });

    if (signUpError) {
        toast.error('خطا در ثبت‌نام', {
            description: signUpError.message.includes('unique constraint') 
              ? 'این شماره تلفن قبلاً ثبت شده است. لطفاً وارد شوید.' 
              : signUpError.message,
        });
        setIsLoading(false);
        return;
    }

    if (user) {
        toast.success('ثبت‌نام با موفقیت انجام شد!', {
            description: 'خوش آمدید! به صفحه اصلی هدایت می‌شوید.',
        });
        
        const destination = values.accountType === 'provider' ? '/profile' : '/';
        router.push(destination);
    } else {
         toast.error('خطای نامشخص', { description: 'ثبت‌نام انجام نشد اما خطایی نیز گزارش نشد. لطفاً دوباره تلاش کنید.'});
    }

    setIsLoading(false);
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام کامل یا نام کسب‌وکار</FormLabel>
                  <FormControl>
                    <Input placeholder={accountType === 'provider' ? "مثال: سالن زیبایی سارا" : "نام و نام خانوادگی خود را وارد کنید"} {...field} disabled={isLoading} />
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
                        این شماره برای ورود شما استفاده خواهد شد.
                    </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {accountType === 'provider' && (
              <>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته‌بندی خدمات</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || categories.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک دسته‌بندی اصلی انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
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
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع خدمات</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || services.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک سرویس تخصصی انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name}
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
