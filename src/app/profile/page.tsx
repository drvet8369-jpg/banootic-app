import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getProviderByPhone } from '@/lib/data';
import { ProfileClientContent } from './profile-client-content';

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.phone) {
        return (
            <div className="container flex-grow flex flex-col items-center justify-center text-center py-20 md:py-32">
                <User className="w-24 h-24 text-muted-foreground mb-6" />
                <h1 className="font-display text-4xl md:text-5xl font-bold">صفحه پروفایل</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                    برای مشاهده پروفایل خود، لطفاً ابتدا وارد شوید.
                </p>
                <Button asChild size="lg" className="mt-8">
                    <Link href="/login">ورود به حساب کاربری</Link>
                </Button>
            </div>
        );
    }
    
    const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();

    if (profile?.account_type !== 'provider') {
        return (
            <div className="container flex-grow flex flex-col items-center justify-center text-center py-20 md:py-32">
                <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
                <h1 className="font-display text-4xl md:text-5xl font-bold">شما ارائه‌دهنده خدمات نیستید</h1>
                <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                    این صفحه فقط برای ارائه‌دهندگان خدمات است. برای ثبت نام به عنوان هنرمند، به صفحه ثبت‌نام بروید.
                </p>
                <Button asChild size="lg" className="mt-8">
                    <Link href="/register">ثبت‌نام به عنوان هنرمند</Link>
                </Button>
            </div>
        );
    }
    
    const providerData = await getProviderByPhone(user.phone);

    if (!providerData) {
         return <div className="flex-grow flex items-center justify-center">در حال بارگذاری پروفایل... یا خطایی رخ داده است.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-12 md:py-20 space-y-8">
            <ProfileClientContent providerData={providerData} />
        </div>
    );
}
