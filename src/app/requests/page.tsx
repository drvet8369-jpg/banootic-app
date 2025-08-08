'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AppContext';
import type { Agreement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, FileText, Hourglass, CheckCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function CustomerRequestsPage() {
  const { user, isLoggedIn, isLoading, agreements } = useAuth();
  const [requests, setRequests] = useState<Agreement[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isLoading || !user || user.accountType !== 'customer') return;
    setRequests(agreements.filter(a => a.customerPhone === user.phone).sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
  }, [isLoading, user, agreements]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">لطفاً وارد شوید</h1>
        <p className="text-muted-foreground mt-2">برای مشاهده درخواست‌های خود باید وارد حساب کاربری خود شوید.</p>
        <Button asChild className="mt-6">
          <Link href="/login">ورود به حساب کاربری</Link>
        </Button>
      </div>
    );
  }

  if (user.accountType !== 'customer') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">صفحه مخصوص مشتریان</h1>
        <p className="text-muted-foreground mt-2">این صفحه فقط برای مشتریان در دسترس است.</p>
        <Button asChild className="mt-6">
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">درخواست‌های من</CardTitle>
          <CardDescription>
            درخواست‌های توافقی که برای هنرمندان ارسال کرده‌اید را در اینجا مشاهده و پیگیری کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-xl">شما هنوز درخواستی ثبت نکرده‌اید</h3>
                <p className="text-muted-foreground mt-2">
                    برای شروع، یک هنرمند را پیدا کرده و برای او درخواست توافق ارسال کنید.
                </p>
                 <Button asChild className="mt-6">
                    <Link href="/search?q=">جستجوی هنرمندان</Link>
                </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-grow space-y-2">
                    <p className="font-bold">هنرمند: {req.providerName || 'نامشخص'}</p>
                     <Button asChild variant="outline" size="sm">
                        <Link href={`/provider/${req.providerPhone}`}>
                           <Eye className="w-4 h-4 ml-2" />
                           مشاهده پروفایل
                        </Link>
                    </Button>
                    {isClient && (
                      <p className="text-xs text-muted-foreground">
                        ارسال شده {formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true, locale: faIR })}
                      </p>
                    )}
                  </div>
                   <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    {req.status === 'pending' ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          <Hourglass className="w-3.5 h-3.5 ml-1.5" />
                          در انتظار تایید
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                           <CheckCircle className="w-3.5 h-3.5 ml-1.5" />
                           تایید شده
                        </Badge>
                    )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
