import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProfileClientContent } from './profile-client-content';
import type { Provider } from '@/lib/types';


export default async function ProfilePage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }
    
    // Simplified query to only fetch from the 'providers' table
    const { data: providerInfo, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', user.id)
        .single();
    
    // Log the specific error to the server console for easier debugging
    if (providerError) {
        console.error("Supabase error fetching provider profile:", providerError);
        // This handles the case where the user is a customer and has no provider profile
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
        return <div>خطا در بارگذاری اطلاعات پروفایل. لطفا با پشتیبانی تماس بگیرید. جزئیات: {providerError.message}</div>;
    }
    
    if (!providerInfo) {
        return <div>اطلاعات پروفایل هنرمند یافت نشد.</div>
    }

    // The portfolio is now a JSON column, so we directly use it.
    const portfolioItems = Array.isArray(providerInfo.portfolio) ? providerInfo.portfolio : [];

    const fullProviderData: Provider = {
        id: providerInfo.id,
        profile_id: providerInfo.profile_id,
        name: providerInfo.name,
        service: providerInfo.service ?? '',
        location: providerInfo.location ?? '',
        phone: providerInfo.phone,
        bio: providerInfo.bio ?? '',
        categorySlug: providerInfo.category_slug as any,
        serviceSlug: providerInfo.service_slug ?? '',
        rating: providerInfo.rating ?? 0,
        reviewsCount: providerInfo.reviews_count ?? 0,
        profileImage: {
            src: providerInfo.profile_image?.src ?? '',
            aiHint: providerInfo.profile_image?.aiHint ?? 'woman portrait'
        },
        portfolio: portfolioItems
    }

    return <ProfileClientContent providerData={fullProviderData} />;
}
