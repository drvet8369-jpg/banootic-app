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
import { createProvider, createCustomer } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
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
  password: z.string().min(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' }),
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
      phone: '',
      password: '',
      accountType: 'customer',
      bio: '',
    },
  });

  const accountType = form.watch('accountType');

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    const normalizedPhone = normalizePhoneNumber(values.phone);
    const email = `${normalizedPhone}@banotik.app`; // Create a dummy email

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
            data: {
                name: values.name,
                phone: normalizedPhone,
                account_type: values.accountType
            }
        }
    });

    if (signUpError) {
        toast({ title: 'خطا در ثبت‌نام', description: signUpError.message, variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    if (!user) {
        toast({ title: 'خطا', description: 'کاربری ایجاد نشد، لطفاً دوباره تلاش کنید.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }

    try {
        if (values.accountType === 'provider') {
            const selectedCategory = categories.find(c => c.slug === values.serviceType);
            const firstServiceInCat = services.find(s => s.categorySlug === selectedCategory?.slug);
            
            await createProvider({
              user_id: user.id,
              name: values.name,
              phone: normalizedPhone,
              service: selectedCategory?.name || 'خدمت جدید',
              location: 'ارومیه',
              bio: values.bio || '',
              category_slug: selectedCategory?.slug || 'beauty',
              service_slug: firstServiceInCat?.slug || 'manicure-pedicure',
            });
        } else {
             await createCustomer({
                user_id: user.id,
                name: values.name,
                phone: normalizedPhone,
             });
        }
      
        toast({
            title: 'ثبت‌نام با موفقیت انجام شد!',
            description: 'خوش آمدید! به صفحه اصلی هدایت می‌شوید.',
        });
        
        // After successful profile creation, we can redirect.
        // The AuthContext will pick up the new session automatically.
        const destination = values.accountType === 'provider' ? '/profile' : '/';
        router.push(destination);
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'مشکلی در ایجاد پروفایل شما پیش آمد.';
        console.error("Profile creation failed:", error);
        toast({
            title: 'خطا در ساخت پروفایل',
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
                  <FormLabel>نام کامل</FormLabel>
                  <FormControl>
                    <Input placeholder={accountType === 'provider' ? "نام کسب و کار یا نام خودتان" : "نام و نام خانوادگی"} {...field} disabled={isLoading} />
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

             <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="حداقل ۶ کاراکتر" {...field} disabled={isLoading} />
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
              ثبت‌نام و ایجاد حساب
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
