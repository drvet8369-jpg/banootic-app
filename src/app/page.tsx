'use client';

import Link from 'next/link';
import { categories } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, Loader2, UserRound, FileText, Handshake, Inbox, Star, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import type { Provider, Agreement } from '@/lib/types';


const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

// --- Dashboard Components ---

function ProviderDashboard() {
    const { user, providers, reviews, agreements } = useAuth();
    const [providerData, setProviderData] = useState<Provider | null>(null);
    const [pendingAgreements, setPendingAgreements] = useState<Agreement[]>([]);

    useEffect(() => {
        if(user && user.accountType === 'provider') {
            const currentProvider = providers.find(p => p.phone === user.phone);
            setProviderData(currentProvider || null);
            if (currentProvider) {
                const pending = agreements.filter(a => a.providerId === currentProvider.id && a.status === 'pending');
                setPendingAgreements(pending);
            }
        }
    }, [user, providers, agreements]);

    if (!providerData) {
        return <div className="text-center py-10">اطلاعات هنرمند یافت نشد.</div>
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">داشبورد هنرمند</CardTitle>
                <CardDescription>خوش آمدید، {providerData.name}! از اینجا کسب و کار خود را مدیریت کنید.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">مجموع امتیاز</CardTitle>
                        <Star className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{providerData.rating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">بر اساس {providerData.reviewsCount} نظر</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">مجموع مشتریان</CardTitle>
                        <Users className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{providerData.reviewsCount}</div>
                         <p className="text-xs text-muted-foreground">تعداد نظرات ثبت شده</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">توافق‌های در انتظار</CardTitle>
                        <Handshake className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingAgreements.length}</div>
                        <p className="text-xs text-muted-foreground">برای تایید نیاز به اقدام شما دارند</p>
                    </CardContent>
                </Card>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 p-4 mt-auto border-t">
                 <Button asChild className="w-full">
                    <Link href="/profile">
                        <UserRound className="w-4 h-4 ml-2" />
                        مدیریت پروفایل
                    </Link>
                </Button>
                <Button asChild className="w-full" variant="secondary">
                    <Link href="/agreements">
                       <Handshake className="w-4 h-4 ml-2" />
                       مدیریت توافق‌ها
                    </Link>
                </Button>
                 <Button asChild className="w-full" variant="outline">
                    <Link href="/inbox">
                        <Inbox className="w-4 h-4 ml-2" />
                        صندوق ورودی
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function CustomerDashboard() {
     const { user } = useAuth();
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="font-headline text-3xl">داشبورد مشتری</CardTitle>
                <CardDescription>خوش آمدید، {user?.name}! از اینجا فعالیت‌های خود را مدیریت کنید.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                 <Button asChild size="lg" className="h-20 text-lg">
                    <Link href="/requests">
                       <FileText className="w-6 h-6 ml-3" />
                       درخواست‌های من
                    </Link>
                </Button>
                 <Button asChild size="lg" className="h-20 text-lg" variant="secondary">
                    <Link href="/inbox">
                        <Inbox className="w-6 h-6 ml-3" />
                        صندوق ورودی
                    </Link>
                </Button>
            </CardContent>
            <CardFooter className="p-4 border-t">
                <p className="text-sm text-muted-foreground">برای شروع، یک هنرمند را جستجو کرده و با او ارتباط برقرار کنید.</p>
            </CardFooter>
        </Card>
    )
}

// --- Welcome Screen for logged-out users ---
const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-24 w-full">
        <Logo className="mx-auto mb-6 h-32 w-32 text-foreground" />
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-accent-foreground/80">
          هنربانو
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
  const { isLoggedIn, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <WelcomeScreen />;
  }

  return (
    <div className="py-12 md:py-20 w-full">
        {user.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />}
    </div>
  );
}
