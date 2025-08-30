
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyPage() {
    return (
        <div className="flex items-center justify-center py-12 md:py-20 flex-grow">
             <Card className="mx-auto max-w-sm w-full text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">ایمیل خود را تایید کنید</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>یک ایمیل حاوی لینک فعال‌سازی به آدرس شما ارسال شده است.</p>
                    <p className="mt-2">لطفا برای تکمیل ثبت نام و ورود به حساب کاربری، روی لینک موجود در ایمیل کلیک کنید.</p>
                     <Link href="/login" className="text-primary underline mt-4 inline-block">بازگشت به صفحه ورود</Link>
                </CardContent>
            </Card>
        </div>
    )
}
