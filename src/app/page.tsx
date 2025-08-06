'use client';

import Link from 'next/link';
import { categories, getProviders } from '@/lib/storage';
import type { Provider } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, LayoutDashboard, ArrowLeft, MessageSquare, Loader2, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import SearchResultCard from '@/components/search-result-card';

const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

const CategoriesSection = () => (
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
    
    // Ensure values are numbers before calculation
    const rating = typeof provider.rating === 'number' ? provider.rating : 0;
    const reviewsCount = typeof provider.reviewsCount === 'number' ? provider.reviewsCount : 0;
    const agreementsCount = typeof provider.agreementsCount === 'number' ? provider.agreementsCount : 0;

    const normalizedReviews = Math.log(reviewsCount + 1);
    const normalizedAgreements = Math.log(agreementsCount + 1);
    
    const score = (rating * ratingWeight) + (normalizedReviews * reviewsWeight) + (normalizedAgreements * agreementsWeight);
    return score;
}

const UserDashboard = () => {
    const { user } = useAuth();
    const [suggestedProviders, setSuggestedProviders] = useState<Provider[]>([]);
    const [providerProfile, setProviderProfile] = useState<Provider | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsProfileLoading(false);
            return;
        };
        
        const allProviders = getProviders();
        if (user.accountType === 'customer') {
            const sortedProviders = [...allProviders].sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
            setSuggestedProviders(sortedProviders.slice(0, 3));
            setIsProfileLoading(false);
        } else if (user.accountType === 'provider' && user.phone) {
            const profile = allProviders.find(p => p.phone === user.phone);
            setProviderProfile(profile || null);
            setIsProfileLoading(false);
        }
    }, [user]);

    if (!user) return null;

    if (user.accountType === 'provider') {
        if (isProfileLoading) {
             return (
              <div className="flex justify-center items-center py-20 flex-grow">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            );
        }
        
        if (!providerProfile) {
            return (
                 <div className="max-w-2xl mx-auto py-12 md:py-20 w-full text-center">
                     <Card>
                         <CardHeader>
                             <CardTitle>خطا</CardTitle>
                             <CardDescription>پروفایل هنرمند شما یافت نشد. لطفاً دوباره وارد شوید یا با پشتیبانی تماس بگیرید.</CardDescription>
                         </CardHeader>
                         <CardFooter>
                              <Button asChild className="w-full">
                                <Link href="/login">ورود مجدد</Link>
                              </Button>
                         </CardFooter>
                     </Card>
                 </div>
            )
        }

        return (
            <div className="max-w-2xl mx-auto py-12 md:py-20 w-full">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                           <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg shrink-0">
                             {providerProfile.profileImage && providerProfile.profileImage.src ? (
                                <img src={providerProfile.profileImage.src} alt={providerProfile.name} className="object-cover w-full h-full" />
                              ) : (
                                 <div className="bg-muted w-full h-full flex items-center justify-center">
                                    <User className="w-12 h-12 text-muted-foreground" />
                                </div>
                              )}
                          </div>
                           <div>
                            <CardTitle className="font-headline text-3xl">داشبورد هنرمند</CardTitle>
                            <CardDescription>خوش آمدید {user.name}، پروفایل خود را از اینجا مدیریت کنید.</CardDescription>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <p><strong>نام کسب‌وکار:</strong> {providerProfile.name}</p>
                            <p><strong>نوع خدمت:</strong> {providerProfile.service}</p>
                            <p><strong>امتیاز شما:</strong> {providerProfile.rating} ({providerProfile.reviewsCount} نظر)</p>
                            <p><strong>تعداد توافقات ثبت شده:</strong> {providerProfile.agreementsCount || 0}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
                         <Button asChild className="w-full flex-1">
                            <Link href="/profile">
                                مدیریت کامل پروفایل
                            </Link>
                        </Button>
                         <Button asChild className="w-full flex-1" variant="outline">
                            <Link href="/agreements">مدیریت توافق‌ها</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

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
