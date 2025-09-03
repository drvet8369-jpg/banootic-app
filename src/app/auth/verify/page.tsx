'use client';

import { Suspense } from 'react';
import { useActionState, useFormStatus } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { verifyOtp } from '@/app/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      تایید و ادامه
    </Button>
  );
}

function VerifyOTPForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const [state, formAction] = useActionState(verifyOtp, null);

  if (!phone) {
    return (
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader><CardTitle>خطا</CardTitle></CardHeader>
        <CardContent>
          <p className="text-destructive">شماره تلفنی برای تایید یافت نشد. لطفاً به صفحه ورود بازگردید.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">تایید شماره تلفن</CardTitle>
        <CardDescription>
          کد ۶ رقمی ارسال شده به شماره {phone} را وارد کنید.
        </CardDescription>
        <CardDescription className="pt-2 text-blue-600 font-bold">
          توجه: در محیط تست، کد تایید همیشه 123456 است.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="phone" value={phone} />
          <div className="flex justify-center">
            <InputOTP maxLength={6} name="token">
              <InputOTPGroup dir="ltr">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {state?.message && (
            <p className="text-sm font-medium text-destructive text-center">{state.message}</p>
          )}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Suspense fallback={<div>در حال بارگذاری...</div>}>
        <VerifyOTPForm />
      </Suspense>
    </div>
  );
}
