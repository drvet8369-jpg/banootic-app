import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogIn } from 'lucide-react';
import { UpgradeForm } from './upgrade-form';
import type { Profile } from '@/lib/types';

export default async function RegisterPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center text-center py-20 flex-grow">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">هنرمند شوید</CardTitle>
                        <CardDescription>برای ارائه خدمات خود، ابتدا باید وارد حساب کاربری خود شوید یا یک حساب جدید بسازید.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LogIn className="w-16 h-16 text-primary mx-auto mb-4" />
                        <Button asChild className="w-full">
                            <Link href="/login?redirect=/register">ورود یا ثبت‌نام</Link>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">پس از ورود، به این صفحه باز خواهید گشت تا اطلاعات هنرمندی خود را کامل کنید.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (error || !profile) {
        // This should not happen for a logged-in user, but handle it gracefully.
        return <div>Error loading profile.</div>
    }

    if (profile.account_type === 'provider') {
        return (
             <div className="container mx-auto flex flex-col items-center justify-center text-center py-20 flex-grow">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">شما در حال حاضر یک هنرمند هستید</CardTitle>
                        <CardDescription>حساب کاربری شما از قبل به عنوان هنرمند ثبت شده است.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <Button asChild className="w-full">
                            <Link href="/profile">مشاهده داشبورد</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // User is a customer, show the upgrade form
    return (
        <div className="max-w-2xl mx-auto py-12 md:py-20">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-headline font-bold">به جامعه هنرمندان بانوتیک بپیوندید</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              با تکمیل فرم زیر، حساب کاربری خود را به حساب هنرمند ارتقا دهید.
            </p>
          </div>
          <UpgradeForm profile={profile as Profile} />
        </div>
    );
}
