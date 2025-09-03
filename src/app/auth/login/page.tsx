'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
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
import { Loader2 } from 'lucide-react';
import { requestOtp } from '@/app/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      ارسال کد تایید
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(requestOtp, null);

  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود یا ساخت حساب کاربری، شماره تلفن خود را وارد کنید تا کد تایید برایتان ارسال شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">شماره تلفن</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="مثال: 09123456789"
                required
                dir="ltr"
              />
            </div>

            {state?.message && (
              <p className="text-sm font-medium text-destructive">{state.message}</p>
            )}
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
