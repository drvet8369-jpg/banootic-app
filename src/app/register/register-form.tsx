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
import type { AppUser } from '@/context/AuthContext';
import { normalizePhoneNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';


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
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<UserRegistrationInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      accountType: 'customer',
      bio: '',
    },
  });

  const accountType = form.watch('accountType');

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    try {
        const normalizedPhone = normalizePhoneNumber(values.phone);
        
        // Check if user already exists in the central users table
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('phone', normalizedPhone)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // Don't throw on "no rows found"
            throw checkError;
        }

        if (existingUser) {
          toast({
            title: 'خطا',
            description: 'این شماره تلفن قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      
        // 1. Create a record in the central `users` table
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({ 
                name: values.name, 
                account_type: values.accountType, 
                phone: normalizedPhone 
            })
            .select()
            .single();
        
        if (userError) throw userError;

        let userToLogin: AppUser | null = null;

        // 2. If provider, create a record in the `providers` table
        if (values.accountType === 'provider') {
            const selectedCategory = categories.find(c => c.slug === values.serviceType);
            const firstServiceInCat = services.find(s => s.categorySlug === selectedCategory?.slug);
            
            const { data: newProvider, error: providerError } = await supabase
                .from('providers')
                .insert({
                  user_id: newUser.id,
                  name: values.name,
                  phone: normalizedPhone,
                  service: selectedCategory?.name || 'خدمت جدید',
                  location: 'ارومیه',
                  bio: values.bio || '',
                  category_slug: selectedCategory?.slug || 'beauty',
                  service_slug: firstServiceInCat?.slug || 'manicure-pedicure',
                })
                .select()
                .single();

            if (providerError) throw providerError;

            userToLogin = {
                id: newUser.id,
                name: newProvider.name,
                phone: newProvider.phone,
                accountType: 'provider'
            };

        } else { // 3. If customer, create a record in the `customers` table
             const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    user_id: newUser.id,
                    name: values.name,
                    phone: normalizedPhone,
                })
                .select()
                .single();
            
             if (customerError) throw customerError;

             userToLogin = {
                id: newUser.id,
                name: newCustomer.name,
                phone: newCustomer.phone,
                accountType: 'customer'
             }
        }
      
        login(userToLogin);
      
        toast({
            title: 'ثبت‌نام با موفقیت انجام شد!',
            description: `خوش آمدید ${userToLogin.name}!`,
        });
      
        const destination = values.accountType === 'provider' ? '/profile' : '/';
        router.push(destination);

    } catch (error) {
         const err = error as any;
         console.error("Registration failed:", err);
         const errorMessage = err.message.includes('unique constraint') 
            ? 'کاربری با این شماره تلفن از قبل وجود دارد.'
            : (err.message || 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.');

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
