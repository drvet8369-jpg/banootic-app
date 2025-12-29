import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertTriangle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProfileClientContent } from './profile-client-content';

export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
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

    const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select(`
            *,
            portfolio_items (
                id,
                image_url,
                ai_hint
            )
        `)
        .eq('profile_id', user.id)
        .single();
    
    // This happens if the user is a customer, not a provider.
    if (providerError || !providerData) {
        // Let's also check their profile type just in case.
        const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
        if (profile?.account_type === 'customer') {
             return (
                <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
                    <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
                    <h1 className="font-display text-4xl md:text-5xl font-bold">این یک پروفایل هنرمند نیست</h1>
                    <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                        حساب شما به عنوان "مشتری" ثبت شده است. این صفحه فقط برای هنرمندان است.
                    </p>
                    <Button asChild size="lg" className="mt-8">
                        <Link href="/">بازگشت به صفحه اصلی</Link>
                    </Button>
                </div>
            );
        }
        // If it's a provider but data is missing, show a generic error.
        return <div>خطا در بارگذاری اطلاعات پروفایل. لطفا دوباره تلاش کنید.</div>;
    }

    // We pass the server-fetched data to a client component for interactivity.
    return <ProfileClientContent providerData={providerData} />;
}
