
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

import { getCustomerAgreements } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, ShieldX, MessageSquare, Phone, UserX } from 'lucide-react';
import type { AgreementWithProviderDetails } from '@/lib/types';

const getInitials = (name: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names[0]?.[0]?.toUpperCase() ?? '?';
};

const StatusInfo = ({ status }: { status: AgreementWithProviderDetails['status'] }) => {
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

export default async function MyAgreementsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        redirect('/login?redirect=/my-agreements');
    }

    const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
    
    // This page is only for customers. Providers are redirected to their own page.
    if (profile?.account_type === 'provider') {
        redirect('/agreements');
    }

    const { agreements, error } = await getCustomerAgreements();

    if (error) {
        return <div className="container mx-auto py-20 text-center text-destructive">خطا در بارگذاری توافق‌ها: {error}</div>
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">توافق‌های من</CardTitle>
                    <CardDescription>در این صفحه می‌توانید وضعیت درخواست‌های توافق خود با هنرمندان را پیگیری کنید.</CardDescription>
                </CardHeader>
                <CardContent>
                    {agreements.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-bold text-xl">هنوز درخواستی ارسال نکرده‌اید</h3>
                            <p className="text-muted-foreground mt-2">
                                با مراجعه به پروفایل هنرمندان می‌توانید درخواست توافق خود را ثبت کنید.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/">مشاهده هنرمندان</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {agreements.map(agreement => {
                                const providerDetails = agreement.provider_profile?.providers[0];
                                const providerPhone = providerDetails?.phone;

                                return (
                                    <div key={agreement.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
                                        <Avatar className="h-12 w-12 ml-4">
                                            {agreement.provider_profile?.profile_image_url && <AvatarImage src={agreement.provider_profile.profile_image_url} />}
                                            <AvatarFallback>{getInitials(providerDetails?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <h4 className="font-bold">{providerDetails?.name || 'هنرمند حذف شده'}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                درخواست شما {formatDistanceToNow(new Date(agreement.created_at), { addSuffix: true, locale: faIR })} ارسال شد.
                                            </p>
                                            {agreement.status === 'accepted' && providerPhone && (
                                                <div className="flex w-full justify-center gap-2 mt-3">
                                                    <Button asChild size="sm" className="w-36">
                                                        <Link href={`/chat/${providerPhone}`}>
                                                            <MessageSquare className="w-4 h-4 ml-2" />
                                                            شروع گفتگو
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="sm" variant="secondary" className="w-36">
                                                        <a href={`tel:${providerPhone}`}>
                                                            <Phone className="w-4 h-4 ml-2" />
                                                            تماس
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0 self-end sm:self-center">
                                            <StatusInfo status={agreement.status} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
