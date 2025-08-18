'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/context/AuthContext';
import { getProviderByPhone, createProvider, getCustomerByPhone, createCustomer } from '@/lib/api';


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
  location: z.string().optional(),
  categorySlug: z.string().optional(),
  serviceSlug: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.location && data.location.trim().length > 0;
    }
    return true;
}, {
    message: 'لطفاً موقعیت مکانی را وارد کنید.',
    path: ['location'],
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.categorySlug;
    }
    return true;
}, {
    message: 'لطفاً دسته‌بندی خدمات را انتخاب کنید.',
    path: ['categorySlug'],
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.serviceSlug;
    }
    return true;
}, {
    message: 'لطفاً نوع خدمات دقیق را انتخاب کنید.',
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
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
  const selectedCategorySlug = form.watch('categorySlug');
  const availableServices = services.filter(s => s.categorySlug === selectedCategorySlug);

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    try {
      const existingProvider = await getProviderByPhone(values.phone);
      const existingCustomer = await getCustomerByPhone(values.phone);

      if (existingProvider || existingCustomer) {
          toast({ title: 'خطا', description: 'این شماره تلفن قبلاً در سیستم ثبت شده است.', variant: 'destructive'});
          setIsLoading(false);
          return;
      }
      
      let userToLogin: User;

      if (values.accountType === 'provider' && values.serviceSlug && values.categorySlug) {
        const selectedService = services.find(s => s.slug === values.serviceSlug);
        
        const newProviderData = {
          name: values.name,
          phone: values.phone,
          service: selectedService?.name || 'خدمت جدید',
          location: values.location || 'ارومیه',
          bio: values.bio || '',
          categorySlug: values.categorySlug as any,
          serviceSlug: values.serviceSlug,
          profileImage: { src: '', aiHint: 'woman portrait' },
          portfolio: [],
        };
        const createdProvider = await createProvider(newProviderData);
        userToLogin = {
            name: createdProvider.name,
            phone: createdProvider.phone,
            accountType: 'provider'
        };
      } else {
        const createdCustomer = await createCustomer({ 
            name: values.name, 
            phone: values.phone,
        });
        userToLogin = createdCustomer;
      }
      
      login(userToLogin);
      
      toast({
        title: 'ثبت‌نام با موفقیت انجام شد!',
        description: 'خوش آمدید! به صفحه اصلی هدایت می‌شوید.',
      });
      
      const destination = values.accountType === 'provider' ? '/profile' : '/';
      router.push(destination);

    } catch (error) {
         console.error("Registration failed:", error);
         let errorMessage = 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.';
         if (error instanceof Error) {
            errorMessage = error.message;
         }
         toast({
            title: 'خطا در ثبت‌نام',
            description: errorMessage,
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        form.reset({ 
                            ...form.getValues(),
                            accountType: value as 'customer' | 'provider',
                            categorySlug: undefined,
                            serviceSlug: undefined,
                            bio: '',
                            location: 'ارومیه',
                         });
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
                    <Input placeholder="09123456789" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {accountType === 'provider' && (
              <>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موقعیت مکانی</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                       <FormDescription>
                        در حال حاضر، ثبت‌نام فقط برای شهر ارومیه امکان‌پذیر است.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categorySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته‌بندی خدمات</FormLabel>
                      <Select onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('serviceSlug', '')
                      }} defaultValue={field.value} disabled={isLoading}>
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
                          <FormLabel>سرویس دقیق شما</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !availableServices.length}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="سرویس دقیق خود را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableServices.map((service) => (
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
    