'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { categories, getProviders, saveProviders, services, getAllUsers, saveAllUsers, activeCities } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/context/AuthContext';
import type { Provider } from '@/lib/types';


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
  serviceType: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.location;
    }
    return true;
}, {
    message: 'لطفاً شهر محل فعالیت خود را انتخاب کنید.',
    path: ['location'],
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

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const allUsers = getAllUsers();
      const existingUser = allUsers.find(u => u.phone === values.phone);

      if (existingUser) {
        toast({
          title: 'خطا در ثبت‌نام',
          description: `این شماره تلفن قبلاً به عنوان ${existingUser.accountType === 'provider' ? 'هنرمند' : 'مشتری'} ثبت شده است. لطفاً وارد شوید.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        router.push('/login');
        return;
      }

      // Check for existing provider by business name, only if registering as a provider
      if (values.accountType === 'provider') {
        const allProviders = getProviders();
        const existingProviderByName = allProviders.find(p => p.name.toLowerCase() === values.name.toLowerCase());
        if (existingProviderByName) {
            toast({
                title: 'خطا در ثبت‌نام',
                description: 'این نام کسب‌وکار قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
      }

      const userToLogin: User = {
        name: values.name,
        phone: values.phone,
        accountType: values.accountType,
      };
      
      const allNewUsers = [...allUsers, userToLogin];
      saveAllUsers(allNewUsers);

      if (values.accountType === 'provider') {
        const allProviders = getProviders();
        const selectedCategory = categories.find(c => c.slug === values.serviceType);
        const firstServiceInCat = services.find(s => s.categorySlug === selectedCategory?.slug);
        
        const newProvider: Provider = {
          id: allProviders.length > 0 ? Math.max(...allProviders.map(p => p.id)) + 1 : 1,
          name: values.name,
          phone: values.phone,
          service: selectedCategory?.name || 'خدمت جدید',
          location: values.location || 'ارومیه',
          bio: values.bio || '',
          categorySlug: selectedCategory?.slug || 'beauty',
          serviceSlug: firstServiceInCat?.slug || 'manicure-pedicure',
          rating: 0,
          reviewsCount: 0,
          agreementsCount: 0,
          profileImage: { src: '', aiHint: 'woman portrait' },
          portfolio: [],
        };
        saveProviders([...allProviders, newProvider]);
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
         toast({
            title: 'خطا در ثبت‌نام',
            description: 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.',
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
                      <FormLabel>شهر محل فعالیت</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک شهر را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        در حال حاضر، فعالیت فقط در شهرهای موجود در لیست امکان‌پذیر است.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        توضیح مختصری درباره آنچه ارائه می‌دهید (حداکثر ۱۶۰ کاراکتر).
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
