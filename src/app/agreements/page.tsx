
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAgreementsForProvider } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AgreementActions } from './AgreementActions';
import type { AgreementWithCustomer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const getInitials = (name: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names[0]?.[0]?.toUpperCase() ?? '?';
};

const StatusInfo = ({ status }: { status: AgreementWithCustomer['status'] }) => {
    switch(status) {
        case 'pending':
            return <Badge variant="secondary"><ShieldAlert className="w-4 h-4 ml-1" />در انتظار تایید</Badge>;
        case 'accepted':
            return <Badge className="bg-green-600 hover:bg-green-700"><ShieldCheck className="w-4 h-4 ml-1" />تایید شده</Badge>;
        case 'rejected':
            return <Badge variant="destructive"><ShieldX className="w-4 h-4 ml-1" />رد شده</Badge>;
        default:
            return <Badge variant="outline">نامشخص</Badge>;
    }
}

export default async function AgreementsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();

    if (profile?.account_type !== 'provider') {
        return (
            <div className="container mx-auto text-center py-20">
                <h1 className="text-2xl font-bold">دسترسی غیرمجاز</h1>
                <p className="text-muted-foreground mt-2">این صفحه فقط برای هنرمندان قابل مشاهده است.</p>
                <Button asChild className="mt-4"><Link href="/">بازگشت به صفحه اصلی</Link></Button>
            </div>
        );
    }
    
    const { agreements, error } = await getAgreementsForProvider();

    if (error) {
        return <div className="container mx-auto py-20 text-center text-destructive">خطا در بارگذاری توافق‌ها: {error}</div>
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">مدیریت توافق‌ها</CardTitle>
                    <CardDescription>مشتریانی که با شما توافق کرده‌اند در اینجا لیست می‌شوند. شما می‌توانید درخواست‌های جدید را تایید یا رد کنید.</CardDescription>
                </CardHeader>
                <CardContent>
                    {agreements.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-bold text-xl">هنوز توافقی دریافت نکرده‌اید</h3>
                            <p className="text-muted-foreground mt-2">
                                مشتریان می‌توانند از پروفایل شما، درخواست توافق ارسال کنند.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {agreements.map(agreement => (
                                <div key={agreement.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                                    <Avatar className="h-12 w-12 ml-4">
                                        {agreement.customer?.profile_image_url && <AvatarImage src={agreement.customer.profile_image_url} />}
                                        <AvatarFallback>{getInitials(agreement.customer?.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <h4 className="font-bold">{agreement.customer?.full_name || 'کاربر حذف شده'}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            درخواست {formatDistanceToNow(new Date(agreement.created_at), { addSuffix: true, locale: faIR })} ثبت شد.
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0 self-end sm:self-center">
                                        <StatusInfo status={agreement.status} />
                                        {agreement.status === 'pending' && (
                                            <AgreementActions agreementId={agreement.id} providerProfileId={user.id} />
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
