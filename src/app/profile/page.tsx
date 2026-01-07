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
    
    // Step 1: Fetch the user's main profile which now contains image and portfolio
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !userProfile) {
        console.error("Supabase error fetching main profile:", profileError);
        return <div>خطا در بارگذاری پروفایل اصلی. لطفا با پشتیبانی تماس بگیرید.</div>;
    }

    if (userProfile.account_type === 'customer') {
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
    
    // Step 2: If the user is a provider, fetch their provider-specific details
    const { data: providerInfo, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', user.id)
        .single();
    
    if (providerError) {
        console.error("Supabase error fetching provider details:", providerError);
        return <div>خطا در بارگذاری اطلاعات تکمیلی هنرمند. جزئیات: {providerError.message}</div>;
    }
    
    if (!providerInfo) {
        return <div>اطلاعات پروفایل هنرمند یافت نشد.</div>
    }

    // Step 3: Combine data into the final object for the client component.
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
            src: userProfile.profile_image_url ?? '',
            aiHint: 'woman portrait'
        },
        portfolio: Array.isArray(userProfile.portfolio) ? userProfile.portfolio : []
    }

    return (
        <div className="max-w-4xl mx-auto py-12 md:py-20 space-y-8">
            <ProfileClientContent providerData={fullProviderData} />
        </div>
    );
}
