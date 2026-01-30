
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAgreementsForProvider } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const getInitials = (name: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names[0]?.[0]?.toUpperCase() ?? '?';
};

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
                    <CardTitle className="font-headline text-3xl">توافق‌های شما</CardTitle>
                    <CardDescription>لیست مشتریانی که با شما توافق کرده‌اند. این یک امتیاز مثبت برای پروفایل شماست.</CardDescription>
                </CardHeader>
                <CardContent>
                    {agreements.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-bold text-xl">هنوز توافقی دریافت نکرده‌اید</h3>
                            <p className="text-muted-foreground mt-2">
                                با ارائه خدمات عالی، مشتریان را تشویق به ارسال توافق کنید.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {agreements.map(agreement => (
                                <div key={agreement.id} className="flex items-center p-4 border rounded-lg">
                                    <Avatar className="h-12 w-12 ml-4">
                                        {agreement.customer?.profile_image_url && <AvatarImage src={agreement.customer.profile_image_url} />}
                                        <AvatarFallback>{getInitials(agreement.customer?.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <h4 className="font-bold">{agreement.customer?.full_name || 'کاربر حذف شده'}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            توافق {formatDistanceToNow(new Date(agreement.created_at), { addSuffix: true, locale: faIR })} ثبت شد.
                                        </p>
                                    </div>
                                    <ShieldCheck className="w-6 h-6 text-green-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
