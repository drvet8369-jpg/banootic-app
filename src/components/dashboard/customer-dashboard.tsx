'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Search } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold">داشبورد مشتری</h1>
        <p className="mt-2 text-lg text-muted-foreground">خوش آمدید، {user?.name}!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>دسترسی سریع</CardTitle>
          <CardDescription>به راحتی فعالیت‌های خود را مدیریت کنید.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild size="lg" variant="outline">
            <Link href="/requests">
              <FileText className="ml-2 text-blue-600" />
              درخواست‌های من
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/inbox">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 text-rose-600 h-5 w-5"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              صندوق ورودی
            </Link>
          </Button>
        </CardContent>
      </Card>
       <div className="text-center mt-8">
           <Button asChild size="lg">
                <Link href="/search?q=">
                    <Search className="ml-2" />
                    جستجوی هنرمندان جدید
                </Link>
            </Button>
       </div>
    </div>
  );
}

    