
'use client';

import Link from 'next/link';
import { categories, getProviders, getReviews, getAgreements } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, Loader2, Handshake, Inbox, Star, UserCheck, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';

const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

const UserDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ reviews: 0, agreements: 0 });

    useEffect(() => {
        if (user && user.accountType === 'provider') {
            const reviews = getReviews().filter(r => r.providerId === user.phone);
            const agreements = getAgreements().filter(a => a.providerPhone === user.phone && a.status === 'confirmed');
            setStats({ reviews: reviews.length, agreements: agreements.length });
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="py-12 md:py-16">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl font-bold">داشبورد شما</h1>
                <p className="mt-3 text-lg text-muted-foreground">خوش آمدید، {user.name}!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Quick Actions */}
                 {user.accountType === 'provider' ? (
                     <>
                        <Link href="/agreements">
                            <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center p-6">
                                <Handshake className="w-16 h-16 mb-4 text-accent"/>
                                <CardTitle className="font-headline text-2xl">مدیریت توافق‌ها</CardTitle>
                                <CardDescription>مشاهده و تایید درخواست‌ها</CardDescription>
                            </Card>
                        </Link>
                         <Link href="/inbox">
                            <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center p-6">
                                <Inbox className="w-16 h-16 mb-4 text-accent"/>
                                <CardTitle className="font-headline text-2xl">صندوق ورودی</CardTitle>
                                <CardDescription>مشاهده پیام‌های مشتریان</CardDescription>
                            </Card>
                        </Link>
                     </>
                 ) : (
                     <>
                         <Link href="/requests">
                            <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center p-6">
                                <Handshake className="w-16 h-16 mb-4 text-accent"/>
                                <CardTitle className="font-headline text-2xl">درخواست‌های من</CardTitle>
                                <CardDescription>پیگیری توافق‌های ارسالی</CardDescription>
                            </Card>
                        </Link>
                         <Link href="/inbox">
                            <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center p-6">
                                <Inbox className="w-16 h-16 mb-4 text-accent"/>
                                <CardTitle className="font-headline text-2xl">صندوق ورودی</CardTitle>
                                <CardDescription>گفتگو با هنرمندان</CardDescription>
                            </Card>
                        </Link>
                     </>
                 )}

                {/* Stats for Provider */}
                {user.accountType === 'provider' && (
                    <Card className="lg:col-span-1 md:col-span-2 bg-muted/50 p-6 flex flex-col justify-center">
                        <CardHeader className="p-0 pb-4 text-center">
                            <CardTitle className="font-headline text-2xl">آمار شما</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Star className="w-6 h-6 text-yellow-500"/>
                                    <span className="font-semibold">تعداد نظرات</span>
                                </div>
                                <span className="font-bold text-lg">{stats.reviews}</span>
                            </div>
                             <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                                 <div className="flex items-center gap-3">
                                    <UserCheck className="w-6 h-6 text-green-500"/>
                                    <span className="font-semibold">توافق‌های تایید شده</span>
                                </div>
                                <span className="font-bold text-lg">{stats.agreements}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
             <div className="mt-12 text-center">
                <Button asChild variant="secondary" size="lg" className="text-lg">
                  <Link href="/search?q=">جستجوی هنرمندان</Link>
                </Button>
            </div>
        </div>
    );
};

const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-24 w-full">
        <Logo className="mx-auto mb-6 h-32 w-32 text-foreground" />
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-accent-foreground/80">
          بانوتیک
        </h1>
        <p className="mt-4 font-headline text-xl md:text-2xl text-foreground">
          با دستان هنرمندت بدرخش
        </p>
        <p className="mt-4 text-lg md:text-xl text-foreground max-w-2xl mx-auto">
          بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی زیبا، بهترین هنرمندان محلی را اینجا پیدا کنید.
        </p>
      </section>

      <section id="categories" className="py-16 w-full">
        <h2 className="text-3xl font-headline font-bold text-center mb-12">خدمات ما</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const Icon = iconMap[category.slug];
            return (
              <Link href={`/services/${category.slug}`} key={category.id}>
                <Card className="h-full flex flex-col items-center text-center p-6 hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <CardHeader className="items-center">
                    {Icon && <Icon className="w-20 h-20 mb-4 text-accent" />}
                    <CardTitle className="font-headline text-2xl">{category.name}</CardTitle>
                  </CardHeader>
                  <CardDescription>{category.description}</CardDescription>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="my-12 text-center">
          <Button asChild variant="secondary" size="lg" className="text-lg">
            <Link href="/register">به جامعه ما بپیوندید</Link>
          </Button>
        </div>
    </div>
);


export default function Home() {
  const { isLoggedIn, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return isLoggedIn ? <UserDashboard /> : <WelcomeScreen />;
}
