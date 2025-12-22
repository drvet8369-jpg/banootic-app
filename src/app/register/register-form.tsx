'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { categories } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { registerUser } from './actions';
import { useAuth } from '@/context/AuthContext';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider'], {
    required_error: 'لطفاً نوع حساب کاربری خود را انتخاب کنید.',
  }),
  name: z.string().min(2, {
    message: 'نام باید حداقل ۲ حرف داشته باشد.',
  }),
  phone: z.string().regex(/^(09|\+989)\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید.',
  }),
  location: z.string().optional(),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'provider') {
        return !!data.location;
    }
    return true;
},{
    message: 'لطفاً شهر خود را انتخاب کنید.',
    path: ['location'],
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
  const searchParams = useSearchParams();
  const { user, loading, session } = useAuth();
  
  // Get phone from URL or from logged-in user session
  const phoneFromParams = searchParams.get('phone');
  const phoneFromAuth = user?.phone;

  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<UserRegistrationInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: phoneFromParams || phoneFromAuth || '',
      accountType: 'customer',
      bio: '',
      location: 'ارومیه',
    },
  });

  useEffect(() => {
    // If user is not logged in and there's no phone in params, they must log in first.
    if (!loading && !session && !phoneFromParams) {
        router.push('/login');
    }
    
    // If the user is already fully registered and somehow lands here, redirect them.
    if (!loading && user && session) {
        if(user.account_type === 'provider' && user.full_name) {
            router.push('/profile');
        } else if (user.account_type === 'customer' && user.full_name) {
            router.push('/');
        }
    }
    
    // Pre-fill phone number if it becomes available from auth
    if (phoneFromAuth) {
      form.setValue('phone', phoneFromAuth);
    }

  }, [user, session, loading, router, phoneFromParams, phoneFromAuth, form]);

  const accountType = form.watch('accountType');

  async function onSubmit(values: UserRegistrationInput) {
    setIsLoading(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    const result = await registerUser(formData);

    if (result?.error) {
        toast.error('خطا در ثبت‌نام', { description: result.error });
        setIsLoading(false);
    } 
  }
  
  // Do not render the form until loading is false AND we have a valid session or phone param
  // This prevents the flicker of the form before the redirect logic in useEffect runs.
  if (loading || (!session && !phoneFromParams)) {
      return (
        <div className="flex w-full justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <Card className="w-full">
        <CardHeader>
            <CardTitle className="text-3xl font-headline">تکمیل اطلاعات ثبت‌نام</CardTitle>
            <CardDescription>فقط چند قدم تا پیوستن به جامعه بانوتیک باقی مانده است.</CardDescription>
        </CardHeader>
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
                    <Input placeholder="09123456789" {...field} disabled={true} />
                  </FormControl>
                  <FormDescription>این شماره تلفن تایید شده و قابل تغییر نیست.</FormDescription>
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
                      <FormLabel>شهر</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="شهر خود را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="ارومیه">ارومیه</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک دسته‌بندی خدمات انتخاب کنید" />
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
                        توضیح مختصری درباره آنچه ارائه می‌دهید.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تکمیل ثبت‌نام و ورود
            </Button>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}