'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
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
import { categories, services as allServices } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function RegisterFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneFromParams = searchParams.get('phone');
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const { user, loading, session } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: phoneFromParams || '',
      accountType: 'customer',
      bio: '',
      location: 'ارومیه',
    },
  });

  useEffect(() => {
    if (!loading && !phoneFromParams) {
        toast.error("خطای اعتبارسنجی", { description: "شماره تلفن تایید شده برای ثبت نام یافت نشد. در حال بازگشت به صفحه ورود..." });
        router.push('/login');
    }
  }, [phoneFromParams, router, loading]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {

      if (!user?.id || !user.phone) {
        const debugDescription = `
          loading: ${loading}, 
          session: ${session ? 'موجود است' : 'موجود نیست'}, 
          user (profile): ${user ? 'موجود است' : 'موجود نیست'}
        `;
        toast.error('لاگ اشکال‌زدایی: وضعیت useAuth در لحظه کلیک', { 
            description: <pre className="whitespace-pre-wrap">{debugDescription}</pre>,
            duration: 10000
        });
        return;
      }

      try {
        const userId = user.id;
        const userPhone = user.phone;
        
        const { name, accountType, location, serviceId, bio } = values;

        const { error: profileInsertError } = await supabase
          .from('profiles')
          .upsert({
              id: userId,
              full_name: name,
              phone: userPhone,
              account_type: accountType,
          }, { onConflict: 'id' });

        if (profileInsertError) { 
            console.error('Error upserting into profiles table:', profileInsertError);
            toast.error('خطای دیتابیس', { description: `خطا در ساخت پروفایل: ${profileInsertError.message}` });
            return;
        }

        if (accountType === 'provider') {
          if (!serviceId || !bio || !location) {
              toast.error("اطلاعات ناقص", { description: "برای هنرمندان، انتخاب شهر، نوع خدمات و نوشتن بیوگرافی الزامی است." });
              return;
          }
          const selectedCategory = categories.find(c => c.id.toString() === serviceId);
          const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

          const { error: providerInsertError } = await supabase
              .from('providers')
              .upsert({
                  profile_id: userId,
                  name: name,
                  service: selectedCategory?.name || 'خدمت جدید',
                  location: location,
                  bio: bio,
                  category_slug: selectedCategory?.slug,
                  service_slug: firstServiceInCat?.slug,
                  phone: userPhone,
              }, { onConflict: 'profile_id' });
          
          if (providerInsertError) {
            console.error('Error upserting into providers table:', providerInsertError);
            toast.error('خطا در ثبت اطلاعات هنرمند', { description: providerInsertError.message });
            return;
          }
        }

        toast.success("ثبت‌نام با موفقیت انجام شد!", { description: "خوش آمدید! در حال هدایت..." });
        const destination = values.accountType === 'provider' ? '/profile' : '/';
        window.location.href = destination;

      } catch (e: any) {
        console.error('A critical error occurred in client-side registration:', e);
        toast.error('خطای پیش‌بینی نشده', { description: `یک خطای پیش‌بینی نشده در کلاینت رخ داد: ${e.message}` });
      }
    });
  };
  
  const accountType = form.watch('accountType');
  
  if (loading) {
      return (
        <div className="flex w-full justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }
  
  if (!phoneFromParams) {
       return (
        <div className="flex w-full justify-center items-center py-20">
          <p>خطا: شماره تلفن یافت نشد. در حال بازگشت...</p>
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
                      name={field.name}
                      disabled={isPending}
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="customer" id="customer"/>
                        </FormControl>
                        <FormLabel htmlFor="customer" className="font-normal">
                         مشتری هستم (برای یافتن و رزرو خدمات)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="provider" id="provider" />
                        </FormControl>
                        <FormLabel htmlFor="provider" className="font-normal">
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
                    <Input placeholder={accountType === 'provider' ? "مثال: سالن زیبایی سارا" : "نام و نام خانوادگی خود را وارد کنید"} {...field} disabled={isPending}/>
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
                    <Input {...field} readOnly disabled className="bg-muted/50"/>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name} disabled={isPending}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name} disabled={isPending}>
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
                          disabled={isPending}
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
            
            <Button type="submit" className="w-full" size="lg" disabled={isPending || loading}>
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تکمیل ثبت‌نام و ورود
            </Button>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
