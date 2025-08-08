'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AppContext';
import type { Agreement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Handshake, Check, Hourglass, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AgreementsPage() {
  const { user, isLoggedIn, isLoading, agreements, updateAgreementStatus } = useAuth();
  const { toast } = useToast();
  const [providerAgreements, setProviderAgreements] = useState<Agreement[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isLoading || !user || user.accountType !== 'provider') return;
    setProviderAgreements(agreements.filter(a => a.providerPhone === user.phone));
  }, [isLoading, user, agreements]);

  const handleConfirmAgreement = (agreementId: string) => {
    updateAgreementStatus(agreementId, 'confirmed');
    toast({ title: 'موفق', description: 'توافق با موفقیت تایید شد.' });
  };
  
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
        <p className="text-muted-foreground mt-2">برای مشاهده این صفحه باید وارد حساب کاربری خود شوید.</p>
        <Button asChild className="mt-6">
          <Link href="/login">ورود به حساب کاربری</Link>
        </Button>
      </div>
    );
  }

  if (user.accountType !== 'provider') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">صفحه مخصوص هنرمندان</h1>
        <p className="text-muted-foreground mt-2">این صفحه فقط برای هنرمندان در دسترس است.</p>
        <Button asChild className="mt-6">
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </Button>
      </div>
    );
  }

  const pendingAgreements = providerAgreements.filter(a => a.status === 'pending');
  const confirmedAgreements = providerAgreements.filter(a => a.status === 'confirmed');

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">مدیریت توافق‌ها</CardTitle>
          <CardDescription>
            تایید توافق‌ها به شما کمک می‌کند تا به عنوان یک هنرمند فعال و قابل اعتماد شناخته شوید و رتبه بالاتری در پلتفرم کسب کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providerAgreements.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Handshake className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-xl">هیچ درخواست توافقی وجود ندارد</h3>
                <p className="text-muted-foreground mt-2">
                    وقتی مشتری درخواست توافقی برای شما ارسال کند، در اینجا نمایش داده می‌شود.
                </p>
            </div>
          ) : (
            <div className="space-y-8">
                <div>
                    <h3 className="font-headline text-2xl mb-4 flex items-center gap-2"><Hourglass className="w-6 h-6 text-yellow-500" /> درخواست‌های در انتظار</h3>
                    {pendingAgreements.length > 0 ? (
                        <div className="space-y-4">
                            {pendingAgreements.map(agreement => (
                                <div key={agreement.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/50">
                                    <div>
                                        <p>مشتری: <span className="font-bold">{agreement.customerName}</span></p>
                                        <p className="text-sm text-muted-foreground">شماره تماس: {agreement.customerPhone}</p>
                                        {isClient && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(agreement.requestedAt), { addSuffix: true, locale: faIR })}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4 sm:mt-0">
                                      <Button onClick={() => handleConfirmAgreement(agreement.id)}>
                                        <Check className="w-4 h-4 ml-2" />
                                        تایید
                                      </Button>
                                      <Button asChild variant="outline">
                                        <Link href={`/chat/${agreement.customerPhone}`}>ارسال پیام</Link>
                                      </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-muted-foreground text-center py-4">در حال حاضر درخواست در انتظاری وجود ندارد.</p>}
                </div>
                
                 <div>
                    <h3 className="font-headline text-2xl mb-4 flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-500" /> توافق‌های تایید شده</h3>
                     {confirmedAgreements.length > 0 ? (
                        <div className="space-y-4">
                            {confirmedAgreements.map(agreement => (
                                <div key={agreement.id} className="flex items-center justify-between p-4 border rounded-lg opacity-70">
                                    <div>
                                        <p>مشتری: <span className="font-bold">{agreement.customerName}</span></p>
                                        {isClient && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                تایید شده در: {new Date(agreement.createdAt).toLocaleDateString('fa-IR')}
                                            </p>
                                        )}
                                    </div>
                                     <Check className="w-5 h-5 text-green-600" />
                                </div>
                            ))}
                        </div>
                     ) : <p className="text-muted-foreground text-center py-4">هنوز توافق تایید شده‌ای وجود ندارد.</p>}
                </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
