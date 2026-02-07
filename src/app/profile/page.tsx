'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ProfileClientContent } from './profile-client-content';
import type { Provider, Profile, Review } from '@/lib/types';


async function getProviderDataForUser(userId: string): Promise<Provider | null> {
    const supabase = createClient();
    
    // This query joins providers and profiles tables to get all necessary data
    const { data, error } = await supabase
        .from('providers')
        .select(`
            *,
            profile:profiles!inner(
                id,
                profile_image_url,
                portfolio
            )
        `)
        .eq('profile_id', userId)
        .single();
    
    if (error || !data) {
        // This is not necessarily an error, the user might just not be a provider yet.
        return null;
    }
    
    // Combine the data into the Provider type shape
    const provider: Provider = {
        id: data.id,
        profile_id: data.profile.id,
        name: data.name,
        service: data.service,
        location: data.location,
        phone: data.phone,
        bio: data.bio,
        categorySlug: data.category_slug,
        serviceSlug: data.service_slug,
        rating: data.rating,
        reviewsCount: data.reviews_count,
        agreements_count: data.agreements_count,
        last_activity_at: data.last_activity_at,
        profileImage: {
            src: data.profile.profile_image_url || '',
            aiHint: 'woman portrait',
        },
        portfolio: data.profile.portfolio || [],
    };
    
    return provider;
}


export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center text-center py-20 flex-grow">
          <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
          <h1 className="font-display text-4xl md:text-5xl font-bold">دسترسی غیرمجاز</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              برای مشاهده پروفایل خود، لطفاً ابتدا وارد شوید.
          </p>
          <Button asChild size="lg" className="mt-8">
              <Link href="/login">ورود به حساب کاربری</Link>
          </Button>
      </div>
    );
  }
  
  const providerData = await getProviderDataForUser(user.id);
  
  if (!providerData) {
     return (
        <div className="container mx-auto flex flex-col items-center justify-center text-center py-20 flex-grow">
            <AlertTriangle className="w-24 h-24 text-amber-500 mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">شما هنرمند نیستید</h1>
            <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                این صفحه فقط برای ارائه‌دهندگان خدمات است. برای ارتقای حساب خود به حساب هنرمند، به صفحه ثبت‌نام بروید.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/register">ارتقا به حساب هنرمند</Link>
            </Button>
        </div>
     )
  }

  return (
    <div className="py-12 md:py-20 space-y-8 container mx-auto">
      <ProfileClientContent providerData={providerData} />
    </div>
  );
}
