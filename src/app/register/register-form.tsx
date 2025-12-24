
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
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

const initialState = {
  error: null,
  success: false,
  destination: null
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      تکمیل ثبت‌نام و ورود
    </Button>
  );
}

// Temporary debug component
const DebugBox = ({ title, data }: { title: string; data: object }) => (
  <div className="p-2 border bg-gray-50/50 rounded-md mt-2 text-left" dir="ltr">
    <p className="text-xs font-bold font-mono">{title}</p>
    <pre className="text-[10px] font-mono break-all whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

function RegisterFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, session } = useAuth();
  
  const phoneFromParams = searchParams.get('phone');
  const phoneFromAuth = user?.phone;
  
  const [state, formAction] = useActionState(registerUser, initialState);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: phoneFromParams || phoneFromAuth || '',
      accountType: 'customer',
      bio: '',
      location: 'ارومیه',
    },
  });
  
  const formValues = form.watch();

  useEffect(() => {
    if (!loading && !session && !phoneFromParams) {
        toast.warning("جلسه کاربری یافت نشد", { description: "در حال بازگشت به صفحه ورود..." });
        router.push('/login');
    }
    
    if (!loading && user && session && user.full_name) {
        toast.info("شما قبلاً ثبت‌نام کرده‌اید", { description: "در حال هدایت به صفحه پروفایل..."});
        router.push(user.account_type === 'provider' ? '/profile' : '/');
    }
    
    const effectivePhone = phoneFromParams || phoneFromAuth;
    if (effectivePhone) {
      form.setValue('phone', effectivePhone);
    }

  }, [user, session, loading, router, phoneFromParams, phoneFromAuth, form]);

  useEffect(() => {
    if (state.error) {
      toast.error('خطا در ثبت‌نام', { description: state.error });
    }
    if (state.success && state.destination) {
      toast.success('ثبت‌نام با موفقیت انجام شد!', { description: 'در حال هدایت شما...' });
      router.push(state.destination);
    }
  }, [state, router]);

  const accountType = form.watch('accountType');
  
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
          <form 
            action={formAction}
            className="space-y-8"
           >
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
                    <Input placeholder={accountType === 'provider' ? "مثال: سالن زیبایی سارا" : "نام و نام خانوادگی خود را وارد کنید"} {...field} />
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
                       <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="یک دسته‌بندی خدمات انتخاب کنید" />
                          </Trigger>
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
            
            <SubmitButton />

             {/* === DEBUG BOX === */}
             <div className="p-4 border-2 border-dashed border-red-400 rounded-lg bg-red-50">
                <h3 className="font-bold text-red-700 text-center">جعبه سیاه تشخیصی (موقت)</h3>
                 <DebugBox title="Auth Context" data={{ user, session: session ? `Authenticated (Expires: ${new Date(session.expires_at! * 1000).toLocaleTimeString()})` : 'null', loading }} />
                 <DebugBox title="Search Params" data={{ phoneFromParams }} />
                 <DebugBox title="Form Values" data={formValues} />
                 <DebugBox title="Server Action State" data={state} />
             </div>
             {/* ================= */}
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default RegisterFormComponent;
