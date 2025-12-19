
'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { requestOtp } from './actions';
import { normalizeIranPhone } from '@/lib/utils';

// We are intentionally NOT using Zod here for debugging purposes.

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [debugMessage, setDebugMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setDebugMessage(''); // Clear previous message

    // --- Start Debugging Block ---
    let normalizedPhone: string;
    try {
      // Manually run the normalization and validation function
      normalizedPhone = normalizeIranPhone(phone);
      // If it succeeds without throwing an error, we know this part is working.
      setDebugMessage(`مرحله اشکال‌زدایی: تابع نرمال‌سازی موفق بود. نتیجه: ${normalizedPhone}`);
    } catch (error: any) {
      // If it throws an error, we catch it and display the exact message.
      setDebugMessage(`متن دقیق خطا از تابع نرمال‌سازی: ${error.message}`);
      setIsLoading(false);
      return; // Stop execution
    }
    // --- End Debugging Block ---

    const formData = new FormData();
    formData.append('phone', normalizedPhone);

    const result = await requestOtp(formData);

    if (result?.error) {
        toast.error('خطا', { description: result.error });
        // Also show server error in our debug view
        setDebugMessage(`خطای بازگشتی از سرور: ${result.error}`);
    }
    // On success, the action handles the redirect itself.
    setIsLoading(false);
  }

  return (
    <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود یا ساخت حساب کاربری، شماره تلفن خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">شماره تلفن</Label>
              <Input 
                id="phone"
                name="phone"
                placeholder="مثال: 09123456789" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                dir="ltr"
                className="text-center"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              ارسال کد تایید
            </Button>
          </form>

          {/* This div will ALWAYS display our debug message */}
          {debugMessage && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h3 className="font-bold">پیام اشکال‌زدایی:</h3>
              <pre className="whitespace-pre-wrap break-words text-xs font-mono">{debugMessage}</pre>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
