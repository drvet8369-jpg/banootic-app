'use client';

import Link from 'next/link';
import { categories } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, Loader2, Handshake, Inbox, Star, UserRound, FileText, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AppContext';
import { StarRating } from '@/components/ui/star-rating';


const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

const ProviderDashboard = () => {
    const { user, providers, isLoading } = useAuth();
    
    if (!user) return null;
    
    const provider = providers.find(p => p.phone === user.phone);

    if (isLoading || !provider) {
       return (
        <div className="flex justify-center items-center py-20 flex-grow">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mr-4">در حال همگام سازی اطلاعات...</p>
        </div>
       );
    }

    return (
        <div className="w-full py-12 md:py-16">
            <Card className="w-full shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">داشبورد هنرمند</CardTitle>
                    <CardDescription>خوش آمدید، {user.name}!</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row justify-around items-center text-center p-6 border-y gap-4">
                    <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-2xl text-primary">{provider.agreementsCount || 0}</span>
                        <span className="text-sm text-muted-foreground">توافق موفق</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-2xl text-primary">{provider.reviewsCount || 0}</span>
                        <span className="text-sm text-muted-foreground">نظر مشتریان</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <StarRating rating={provider.rating || 0} />
                        <span className="text-sm text-muted-foreground">امتیاز کل</span>
                    </div>
                </CardContent>
                <CardFooter className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                     <Button asChild variant="outline" className="text-foreground font-bold hover:bg-primary/20 border-primary/30 h-14 bg-primary/10">
                        <Link href="/profile">
                            <UserRound className="w-5 h-5 ml-2 text-primary" />
                            <span>پروفایل و نمونه‌کار</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="text-foreground font-bold hover:bg-primary/20 border-primary/30 h-14 bg-primary/10">
                        <Link href="/agreements">
                            <Handshake className="w-5 h-5 ml-2 text-primary" />
                             <span>مدیریت توافق‌ها</span>
                        </Link>
                    </Button>
                     <Button asChild variant="outline" className="text-foreground font-bold hover:bg-primary/20 border-primary/30 h-14 bg-primary/10">
                        <Link href="/inbox">
                            <Inbox className="w-5 h-5 ml-2 text-primary" />
                             <span>صندوق ورودی</span>
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
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-y">
            <Button
              asChild
              variant="outline"
              className="bg-primary/10 text-primary-foreground hover:bg-primary/20 border-primary/20 h-20 text-base sm:text-lg"
            >
              <Link href="/requests">
                <FileText className="w-5 h-5 ml-3" />
                <span className="font-semibold">درخواست‌های من</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-primary/10 text-primary-foreground hover:bg-primary/20 border-primary/20 h-20 text-base sm:text-lg"
            >
              <Link href="/inbox">
                <Inbox className="w-5 h-5 ml-3" />
                <span className="font-semibold">صندوق ورودی</span>
              </Link>
            </Button>
          </CardContent>
          <CardFooter className="p-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/search?q=">
                <Search className="w-5 h-5 ml-2" />
                جستجوی هنرمندان
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
}

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
  const { user, isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
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
