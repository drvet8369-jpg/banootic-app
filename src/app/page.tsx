'use client';

import Link from 'next/link';
import { categories, getProviders } from '@/lib/data';
import type { Provider } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift, LayoutDashboard, ArrowLeft, MessageSquare } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import SearchResultCard from '@/components/search-result-card';
import { Badge } from '@/components/ui/badge';

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

    const normalizedReviews = Math.log((provider.reviewsCount || 0) + 1);
    const normalizedAgreements = Math.log((provider.agreementsCount || 0) + 1);

    const score = (provider.rating * ratingWeight) 
                + (normalizedReviews * reviewsWeight) 
                + (normalizedAgreements * agreementsWeight);

    return score;
}

const UserDashboard = () => {
    const { user } = useAuth();
    const [suggestedProviders, setSuggestedProviders] = useState<Provider[]>([]);
    const [providerProfile, setProviderProfile] = useState<Provider | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const allProviders = getProviders();
        if (user?.accountType === 'customer') {
            const sortedProviders = [...allProviders].sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
            setSuggestedProviders(sortedProviders.slice(0, 3));
        } else if (user?.accountType === 'provider' && user.phone) {
            const profile = allProviders.find(p => p.phone === user.phone);
            setProviderProfile(profile || null);
            
            // Check for unread messages
            try {
                const allChatsData = JSON.parse(localStorage.getItem('banootik_inbox_chats') || '{}');
                const totalUnread = Object.values(allChatsData)
                  .filter((chat: any) => chat.members?.includes(user.phone))
                  .reduce((acc: number, chat: any) => {
                    const selfInfo = chat.participants?.[user.phone];
                    return acc + (selfInfo?.unreadCount || 0);
                  }, 0);
                setUnreadCount(totalUnread);
            } catch (e) {
                setUnreadCount(0);
            }
        }
    }, [user]);

    if (!user) return null;

    if (user.accountType === 'provider') {
        return (
            <div className="py-12 md:py-20 w-full">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                           <LayoutDashboard className="w-8 h-8 text-primary" />
                           <div>
                            <CardTitle className="font-headline text-3xl">داشبورد هنرمند</CardTitle>
                            <CardDescription>خوش آمدید {user.name}، پروفایل خود را از اینجا مدیریت کنید.</CardDescription>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {providerProfile ? (
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <p><strong>نام کسب‌وکار:</strong> {providerProfile.name}</p>
                                <p><strong>نوع خدمت:</strong> {providerProfile.service}</p>
                                <p><strong>امتیاز شما:</strong> {providerProfile.rating} ({providerProfile.reviewsCount} نظر)</p>
                                <p><strong>تعداد توافقات ثبت شده:</strong> {providerProfile.agreementsCount || 0}</p>
                                {unreadCount > 0 && (
                                     <div className="flex items-center gap-2 pt-2 text-destructive font-bold">
                                        <MessageSquare className="w-5 h-5"/>
                                        <p>شما {unreadCount} پیام جدید در <Link href="/inbox" className="underline">صندوق ورودی</Link> دارید.</p>
                                     </div>
                                )}
                            </div>
                        ) : <p className="text-muted-foreground">در حال بارگذاری اطلاعات پروفایل...</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
                         <Button asChild className="w-full flex-1">
                            <Link href="/profile">
                                مدیریت پروفایل و نمونه‌کارها
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

    // Customer Dashboard
    return (
        <div className="py-12 md:py-20 w-full">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">سلام {user.name}!</h1>
                <p className="mt-3 text-lg text-muted-foreground">در ادامه چند هنرمند پیشنهادی برای شما آمده است.</p>
            </div>
            
            {suggestedProviders.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {suggestedProviders.map(provider => (
                        <SearchResultCard key={provider.id} provider={provider} />
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
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center">
      {isLoggedIn ? <UserDashboard /> : <LandingPage />}
    </div>
  );
}
