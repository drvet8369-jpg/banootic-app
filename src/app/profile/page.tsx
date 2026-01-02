import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertTriangle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProfileClientContent } from './profile-client-content';
import { getProviderByPhone } from '@/lib/data';
import type { Provider } from '@/lib/types';


export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Since a provider profile is tied to a user profile, we can fetch it this way.
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
        return <div>خطا در بارگذاری اطلاعات پروفایل. لطفا دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.</div>;
    }

    const fullProviderData: Provider = {
        id: providerData.id,
        profile_id: providerData.profile_id,
        name: providerData.name,
        service: providerData.service ?? '',
        location: providerData.location ?? '',
        phone: providerData.phone,
        bio: providerData.bio ?? '',
        categorySlug: providerData.category_slug as any,
        serviceSlug: providerData.service_slug ?? '',
        rating: providerData.rating ?? 0,
        reviewsCount: providerData.reviews_count ?? 0,
        profileImage: {
            src: providerData.profile_image?.src ?? '',
            aiHint: providerData.profile_image?.aiHint ?? 'woman portrait'
        },
        portfolio: providerData.portfolio_items.map(item => ({
            id: item.id,
            src: item.image_url,
            aiHint: item.ai_hint ?? 'new work'
        }))
    }

    return <ProfileClientContent providerData={fullProviderData} />;
}
