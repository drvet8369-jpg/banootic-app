
'use client';

import Link from 'next/link';
import { categories, getProviders, getReviews, getAgreements } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, Loader2, Handshake, Inbox, Star, UserCheck, MessageSquare, Edit, User, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import type { Provider, Review, Agreement as AgreementType } from '@/lib/types';


const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ 
        reviewsCount: 0, 
        agreementsCount: 0, 
        averageRating: 0 
    });

    const loadProviderData = useCallback(() => {
        if (user && user.accountType === 'provider') {
            const allProviders = getProviders();
            const currentProvider = allProviders.find(p => p.phone === user.phone);
            
            if (currentProvider) {
                setStats({
                    reviewsCount: currentProvider.reviewsCount || 0,
                    agreementsCount: currentProvider.agreementsCount || 0,
                    averageRating: currentProvider.rating || 0,
                });
            }
        }
    }, [user]);

    useEffect(() => {
        loadProviderData();
        // Add focus listener to refresh data when tab is re-focused
        window.addEventListener('focus', loadProviderData);
        return () => window.removeEventListener('focus', loadProviderData);
    }, [loadProviderData]);

    if (!user) return null;

    return (
        <div className="w-full py-12 md:py-16">
            <Card className="w-full shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">داشبورد هنرمند</CardTitle>
                    <CardDescription>خوش آمدید، {user.name}!</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-around items-center text-center p-6 border-y">
                    <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-2xl">{stats.agreementsCount}</span>
                        <span className="text-sm text-muted-foreground">توافق موفق</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-2xl">{stats.reviewsCount}</span>
                        <span className="text-sm text-muted-foreground">نظر مشتریان</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <StarRating rating={stats.averageRating} readOnly />
                        <span className="text-sm text-muted-foreground">امتیاز کل</span>
                    </div>
                </CardContent>
                <CardFooter className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                    <Button asChild variant="outline" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/30 h-12">
                        <Link href="/profile">
                            <Edit className="w-5 h-5 ml-2" />
                            <span className="font-bold">مدیریت پروفایل</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/30 h-12">
                        <Link href="/agreements">
                            <Handshake className="w-5 h-5 ml-2" />
                             <span className="font-bold">مدیریت توافق‌ها</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/30 h-12">
                        <Link href="/inbox">
                            <Inbox className="w-5 h-5 ml-2" />
                             <span className="font-bold">صندوق ورودی</span>
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};


const CustomerDashboard = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <div className="w-full py-12 md:py-16">
            <Card className="w-full shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">داشبورد مشتری</CardTitle>
                    <CardDescription>خوش آمدید، {user.name}!</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                    <Button asChild variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 h-20 text-lg">
                        <Link href="/requests">
                            <FileText className="w-6 h-6 ml-3" />
                            <span className="font-semibold">درخواست‌های من</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 h-20 text-lg">
                        <Link href="/inbox">
                            <Inbox className="w-6 h-6 ml-3" />
                             <span className="font-semibold">صندوق ورودی</span>
                        </Link>
                    </Button>
                </CardContent>
                 <CardFooter className="p-4">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/search?q=">جستجوی هنرمندان</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

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
  const { user, isLoggedIn, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <WelcomeScreen />;
  }

  return user.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />;
}
