'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { requestOtp } from './actions';
import { normalizeIranPhone } from '@/lib/utils';

// State to hold our debug message
let debugMessageState = '';

const formSchema = z.object({
  phone: z.string()
    .transform((val, ctx) => {
        try {
            const normalized = normalizeIranPhone(val);
            if (!normalized) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "شماره تلفن نمی‌تواند خالی باشد.",
                });
                return z.NEVER;
            }
            if (!/^09\d{9}$/.test(normalized)) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `پس از نرمال‌سازی، شماره '${normalized}' با فرمت 09... مطابقت ندارد.`,
                });
                return z.NEVER;
            }
            return normalized;
        } catch (e: any) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: e.message || "خطای ناشناخته در نرمال‌سازی",
            });
            return z.NEVER;
        }
    })
});


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  // Add state to display the debug message on the screen
  const [debugMessage, setDebugMessage] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
     // This will show errors as soon as the user stops typing
    mode: 'onBlur'
  });
  
  // This function will be called when the form is submitted WITH errors
  const onInvalid = (errors: any) => {
      // Stringify the errors object and set it to our state
      const errorString = JSON.stringify(errors, null, 2);
      setDebugMessage(`Validation Error: ${errorString}`);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setDebugMessage(''); // Clear previous debug messages on new submit
    
    const formData = new FormData();
    formData.append('phone', values.phone);

    const result = await requestOtp(formData);

    if (result?.error) {
        toast.error('خطا', { description: result.error });
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
          <Form {...form}>
            {/* We pass both onSubmit and onInvalid handlers */}
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: 09123456789" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ارسال کد تایید
              </Button>
            </form>
          </Form>

          {/* This div will display our debug message on the screen */}
          {debugMessage && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h3 className="font-bold">پیام اشکال‌زدایی:</h3>
              <pre className="whitespace-pre-wrap break-words text-xs">{debugMessage}</pre>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}