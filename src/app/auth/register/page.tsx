'use client';

import { useActionState, useFormStatus } from 'react';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { categories, services } from '@/lib/constants';
import { completeRegistration } from '@/app/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      تکمیل ثبت‌نام
    </Button>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const [state, formAction] = useActionState(completeRegistration, null);

  const [accountType, setAccountType] = useState('customer');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');

  if (!phone) {
    return (
      <div className="text-center text-destructive">
        خطا: شماره تلفن برای ثبت‌نام یافت نشد. لطفاً به صفحه ورود بازگردید.
        <Button asChild variant="link" className="mt-4">
          <Link href="/auth/login">بازگشت</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">تکمیل اطلاعات</CardTitle>
        <CardDescription>
          فقط چند قدم تا ساخت حساب کاربری شما باقی مانده است.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="phone" value={phone} />

          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label>نوع حساب کاربری خود را انتخاب کنید:</Label>
            <RadioGroup
              name="accountType"
              value={accountType}
              onValueChange={setAccountType}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer" className="font-normal">
                  مشتری هستم (برای یافتن و رزرو خدمات)
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="provider" id="provider" />
                <Label htmlFor="provider" className="font-normal">
                  ارائه‌دهنده خدمات هستم (برای ارائه هنر و تخصص خود)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">نام کامل یا نام کسب‌وکار</Label>
            <Input
              id="name"
              name="name"
              placeholder={accountType === 'provider' ? 'مثال: سالن زیبایی سارا' : 'نام و نام خانوادگی'}
              required
            />
          </div>

          {/* Provider-specific fields */}
          {accountType === 'provider' && (
            <>
              {/* Service Category */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">دسته‌بندی خدمات</Label>
                <Select
                  name="serviceType"
                  onValueChange={setSelectedCategorySlug}
                  required
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="یک دسته‌بندی خدمات انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Specific Service */}
              {selectedCategorySlug && (
                 <div className="space-y-2">
                    <Label htmlFor="serviceSlug">خدمت دقیق</Label>
                    <Select name="serviceSlug" required>
                        <SelectTrigger id="serviceSlug">
                            <SelectValue placeholder="نوع دقیق خدمت خود را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                        {services.filter(s => s.categorySlug === selectedCategorySlug).map((service) => (
                            <SelectItem key={service.slug} value={service.slug}>
                            {service.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
              )}

               {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">مکان</Label>
                <Input id="location" name="location" defaultValue="ارومیه" disabled />
              </div>
              
              {/* Bio */}
              <div className="space-y-2">
                 <Label htmlFor="bio">بیوگرافی کوتاه</Label>
                 <Textarea
                    id="bio"
                    name="bio"
                    placeholder="کمی در مورد خدمات و هنر خود به ما بگویید (حداقل ۱۰ کاراکتر)."
                    className="resize-none"
                    required
                    minLength={10}
                />
              </div>
            </>
          )}

          {state?.message && (
            <p className="text-sm font-medium text-destructive">{state.message}</p>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20 flex-grow">
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
