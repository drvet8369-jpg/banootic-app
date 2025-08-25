
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Agreement, Provider } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, FileText, CheckCircle, Hourglass, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import { getAgreementsByCustomer, getAllProviders } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CustomerRequestsPage() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user || user.accountType !== 'customer') {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
        const [userAgreements, allProviders] = await Promise.all([
            getAgreementsByCustomer(user.phone),
            getAllProviders()
        ]);
        
        setAgreements(userAgreements);
        setProviders(allProviders);
    } catch(e){
        console.error("Failed to fetch agreements:", e);
        toast({ title: 'خطا', description: 'خطا در بارگذاری درخواست‌ها. لطفاً دوباره تلاش کنید.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn && user?.accountType === 'customer') {
      fetchData();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isLoggedIn, user, fetchData, isAuthLoading]);
  
  const getProviderName = (phone: string) => {
      const provider = providers.find(p => p.phone === phone);
      return provider?.name || `هنرمند ${phone.slice(-4)}`;
  }

  if (isLoading || isAuthLoading) {
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
        <p className="text-muted-foreground mt-2">برای مشاهده این صفحه باید وارد حساب کاربری خود شوید.</p>
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
            درخواست‌های توافقی که برای هنرمندان ارسال کرده‌اید را در اینجا پیگیری کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-xl">شما هنوز درخواستی ثبت نکرده‌اید</h3>
                <p className="text-muted-foreground mt-2">
                   برای ثبت درخواست، به پروفایل یک هنرمند مراجعه کرده و روی دکمه "درخواست توافق" کلیک کنید.
                </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agreements.map(request => (
                <div key={request.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg">
                  <div className="flex-grow">
                    <p>هنرمند: <span className="font-bold">{getProviderName(request.provider_phone)}</span></p>
                    {isClient && (
                      <p className="text-xs text-muted-foreground mt-1">
                          درخواست شده: {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true, locale: faIR })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {request.status === 'pending' ? (
                       <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                          <Hourglass className="w-4 h-4" />
                          <span>در انتظار تایید</span>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          <span>تایید شده</span>
                       </div>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/provider/${request.provider_phone}`}>
                         <Eye className="w-4 h-4 ml-2" />
                         مشاهده پروفایل
                      </Link>
                    </Button>
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
