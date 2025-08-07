'use client';

import Link from 'next/link';
import { categories } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, UserRound, Inbox, Eye } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

const LandingPage = () => (
  <>
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
  </>
);

const UserDashboard = () => {
    const { user } = useAuth();
    if (!user) return null;

    return (
        <div className="py-12 md:py-20 w-full flex justify-center">
            <div className="max-w-md w-full">
                 <Card>
                    <CardHeader className="text-center">
                         <CardTitle className="font-headline text-3xl">خوش آمدید، {user.name}!</CardTitle>
                         <CardDescription>
                             {user.accountType === 'provider' 
                                 ? 'داشبورد شما برای مدیریت پروفایل و ارتباطات'
                                 : 'از اینجا به خدمات و پیام‌های خود دسترسی پیدا کنید.'
                             }
                         </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {user.accountType === 'provider' && (
                             <Button asChild size="lg" className="w-full font-bold h-14">
                                <Link href="/profile">
                                    <UserRound className="ml-3" />
                                    مدیریت پروفایل
                                </Link>
                            </Button>
                        )}
                        <Button asChild size="lg" variant="secondary" className="w-full font-bold h-14">
                            <Link href="/inbox">
                                <Inbox className="ml-3" />
                                صندوق ورودی
                            </Link>
                        </Button>
                        {user.accountType === 'customer' && (
                              <Button asChild size="lg" variant="outline" className="w-full font-bold h-14">
                                <Link href="/search?q=">
                                    <Eye className="ml-3" />
                                    مشاهده همه هنرمندان
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}

export default function Home() {
  const { isLoggedIn, isAuthLoading } = useAuth();
  
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center">
       {isLoggedIn ? <UserDashboard /> : <LandingPage />}
    </div>
  );
}
