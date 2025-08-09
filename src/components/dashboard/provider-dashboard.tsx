'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Eye, Inbox, Users } from 'lucide-react';
import Link from 'next/link';

export default function ProviderDashboard() {
    const { user, agreements } = useAuth();

    const pendingAgreements = agreements.filter(a => a.providerPhone === user?.phone && a.status === 'pending').length;
    const confirmedAgreements = agreements.filter(a => a.providerPhone === user?.phone && a.status === 'confirmed').length;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">سلام، {user?.name}!</h1>
                <p className="text-muted-foreground mt-2 text-lg">به داشبورد مدیریت خود خوش آمدید.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">توافق‌های تایید شده</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{confirmedAgreements}</div>
                        <p className="text-xs text-muted-foreground">تعداد کل مشتریانی که توافق را تایید کرده‌اند.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">درخواست‌های در انتظار</CardTitle>
                         <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingAgreements}</div>
                        <p className="text-xs text-muted-foreground">درخواست‌های جدیدی که منتظر تایید شما هستند.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">بازدید پروفایل (نمایشی)</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+۱۲۵</div>
                        <p className="text-xs text-muted-foreground">نسبت به ماه گذشته</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>اقدامات سریع</CardTitle>
                    <CardDescription>به بخش‌های مهم پنل خود دسترسی سریع داشته باشید.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                     <Button asChild size="lg">
                        <Link href="/profile">ویرایش پروفایل</Link>
                    </Button>
                     <Button asChild variant="secondary" size="lg">
                        <Link href={`/provider/${user?.id}`}>
                            <Eye className="w-4 h-4 ml-2" />
                            مشاهده پروفایل عمومی
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/inbox">صندوق ورودی پیام‌ها</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/agreements">مدیریت توافق‌ها</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
