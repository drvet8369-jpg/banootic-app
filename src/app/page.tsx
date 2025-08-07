
'use client';

import Link from 'next/link';
import { categories, getProviders } from '@/lib/storage';
import type { Provider } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, LayoutDashboard, ArrowLeft, MessageSquare, Loader2, User, Handshake, Eye, Inbox, Star } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import SearchResultCard from '@/components/search-result-card';
import { StarRating } from '@/components/ui/star-rating';

const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

const CategoriesSection = () => (
   <section id="categories" className="py-16 w-full">
      <h2 className="text-3xl font-headline font-bold text-center mb-12">دسته‌بندی خدمات</h2>
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
);

const LandingPage = () => (
  <>
    <section className="text-center py-20 lg:py-24 w-full">
      <Logo className="mx-auto mb-6 h-32 w-32 text-foreground" />
      <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-accent-foreground/80 mb-2">
        بانوتیک
      </h1>
      <p className="font-headline text-xl md:text-2xl text-foreground mb-6">
        با دستان هنرمندت بدرخش
      </p>
      <p className="mt-4 text-lg md:text-xl text-foreground max-w-2xl mx-auto">
        بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی زیبا، بهترین هنرمندان محلی را اینجا پیدا کنید.
      </p>
    </section>
    <CategoriesSection />
    <div className="my-12 text-center">
      <Button asChild variant="secondary" size="lg" className="text-lg">
        <Link href="/register">به جامعه ما بپیوندید</Link>
      </Button>
    </div>
  </>
);

const calculateRankingScore = (provider: Provider): number => {
    const ratingWeight = 0.20; 
    const reviewsWeight = 0.50; 
    const agreementsWeight = 0.30;
    
    const rating = typeof provider.rating === 'number' ? provider.rating : 0;
    const reviewsCount = typeof provider.reviewsCount === 'number' ? provider.reviewsCount : 0;
    const agreementsCount = typeof provider.agreementsCount === 'number' ? provider.agreementsCount : 0;

    const normalizedReviews = Math.log(reviewsCount + 1);
    const normalizedAgreements = Math.log(agreementsCount + 1);
    
    const score = (rating * ratingWeight) + (normalizedReviews * reviewsWeight) + (normalizedAgreements * agreementsWeight);
    return score;
}

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [provider, setProvider] = useState<Provider | null>(null);

    useEffect(() => {
        if (!user) return;
        const allProviders = getProviders();
        const currentProvider = allProviders.find(p => p.phone === user.phone);
        if (currentProvider) {
            setProvider(currentProvider);
        }
    }, [user]);

    if (!user || !provider) {
        return (
            <div className="flex justify-center items-center py-20 flex-grow">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="py-12 md:py-20 w-full flex justify-center">
            <div className="max-w-3xl w-full">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-3xl">داشبورد هنرمند</CardTitle>
                        <CardDescription>خوش آمدید {user.name}!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <h4 className="text-lg font-bold text-center mb-4">آمار عملکرد شما</h4>
                            <div className="flex justify-around items-center text-center">
                                <div className="flex flex-col items-center">
                                    <StarRating rating={provider.rating} readOnly />
                                    <span className="text-xs text-muted-foreground mt-1">{provider.reviewsCount} نظر</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 font-bold text-lg text-primary">
                                        <Handshake className="w-5 h-5"/>
                                        <span>{provider.agreementsCount || 0}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">توافق موفق</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Button asChild size="lg" className="h-auto py-4 flex flex-col gap-2">
                                <Link href="/profile">
                                    <User className="w-8 h-8" />
                                    <span className="font-bold">مدیریت پروفایل و نمونه‌کار</span>
                                </Link>
                            </Button>
                             <Button asChild size="lg" variant="outline" className="h-auto py-4 flex flex-col gap-2">
                                <Link href="/agreements">
                                    <Handshake className="w-8 h-8" />
                                    <span className="font-bold">مدیریت توافق‌ها</span>
                                </Link>
                            </Button>
                        </div>
                         <Button asChild size="lg" variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2">
                            <Link href="/inbox">
                                <Inbox className="w-8 h-8" />
                                <span className="font-bold">صندوق ورودی</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


const CustomerDashboard = () => {
    const { user } = useAuth();
    const [suggestedProviders, setSuggestedProviders] = useState<Provider[]>([]);
    
    useEffect(() => {
        if (!user) return;
        
        const allProviders = getProviders();
        const sortedProviders = [...allProviders].sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
        setSuggestedProviders(sortedProviders.slice(0, 3));
    }, [user]);

    if (!user) return null;

    return (
        <div className="py-12 md:py-20 w-full">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">سلام {user.name}!</h1>
                <p className="mt-3 text-lg text-muted-foreground">در ادامه چند هنرمند پیشنهادی برای شما آمده است.</p>
            </div>
            
            {suggestedProviders.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {suggestedProviders.map(provider => (
                        <SearchResultCard key={provider.phone} provider={provider} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>در حال حاضر هنرمندی برای پیشنهاد یافت نشد.</p>
                </div>
            )}
             <div className="mt-12 text-center">
                <Button asChild size="lg">
                    <Link href="/search?q=">
                        مشاهده تمام هنرمندان
                        <ArrowLeft className="w-5 h-5 mr-2" />
                    </Link>
                </Button>
            </div>
            <CategoriesSection />
        </div>
    )
}

export default function Home() {
  const { isLoggedIn, user, isAuthLoading } = useAuth();
  
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isLoggedIn) {
      return user?.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
       <LandingPage />
    </div>
  );
}
