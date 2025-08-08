'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Inbox, Search } from 'lucide-react';
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
              <FileText className="ml-2 text-primary" />
              درخواست‌های من
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/inbox">
              <Inbox className="ml-2 text-accent" />
              صندوق ورودی
            </Link>
          </Button>
        </CardContent>
      </Card>
       <div className="text-center">
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
