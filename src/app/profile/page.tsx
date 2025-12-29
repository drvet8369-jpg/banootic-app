// This file is now a Server Component
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';

import { User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileClientContent } from './profile-client-content';


export default async function ProfilePage() {
  noStore(); // Ensure data is fresh on every visit
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, redirect to the login page.
    redirect('/login');
  }

  // Fetch the user's profile from the 'profiles' table
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.full_name) {
    // This case happens if a user is logged in but their profile is incomplete.
    // We redirect them to the verify page which handles the registration flow.
    redirect(`/login/verify?phone=${user.phone}`);
  }

  // If the user is a customer, they shouldn't access this page directly.
  if (profile.account_type === 'customer') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
        <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
        <h1 className="font-display text-4xl md:text-5xl font-bold">شما ارائه‌دهنده خدمات نیستید</h1>
        <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
          این صفحه فقط برای ارائه‌دهندگان خدمات (هنرمندان) است.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </Button>
      </div>
    );
  }
  
  // If the user is a provider, fetch their detailed provider data.
  const { data: providerData } = await supabase
    .from('providers')
    .select(`*, portfolio_items ( id, image_url, ai_hint )`)
    .eq('profile_id', user.id)
    .single();
    
  if (!providerData) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
            <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">پروفایل هنرمند یافت نشد</h1>
            <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                مشکلی در بارگذاری اطلاعات پروفایل هنرمندی شما رخ داده است.
            </p>
        </div>
     )
  }

  // Pass the server-fetched data to the client component for interactivity.
  return <ProfileClientContent providerData={providerData} />;
}
