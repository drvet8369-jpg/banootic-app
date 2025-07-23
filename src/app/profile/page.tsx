
'use client';

import { useAuth } from '@/context/AuthContext';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, MessageSquare, User, AlertTriangle, Inbox, Bot, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import type { Provider } from '@/lib/types';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { providers as defaultProviders, getProviders, saveProviders } from '@/lib/data';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';


// A mock StarRating component for the profile preview
const StarRating = ({ rating, reviewsCount }: { rating: number; reviewsCount: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 fill-current" />
        ))}
        {halfStar && <Star key="half" className="w-5 h-5" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" />
        ))}
      </div>
      <span className="text-muted-foreground text-sm">({reviewsCount} نظر)</span>
    </div>
  );
};


export default function ProfilePage() {
  const { user, isLoggedIn } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user && user.accountType === 'provider') {
      const allProviders = getProviders();
      const currentProvider = allProviders.find(p => p.phone === user.phone);
      
      if (currentProvider) {
        setProvider(currentProvider);
      } else {
        // If provider not found (e.g., new registration), create a mock profile
        const mockProvider: Provider = {
          id: 99, 
          name: user.name,
          service: 'خدمات شما',
          location: 'مکان شما (پیش‌فرض)',
          phone: user.phone,
          bio: 'این یک پیش‌نمایش از پروفایل شماست. اطلاعات کامل‌تر در آینده نمایش داده خواهد شد.',
          categorySlug: 'beauty', 
          serviceSlug: 'manicure-pedicure', 
          rating: 5,
          reviewsCount: 0,
          portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'portfolio preview' }],
        };
        setProvider(mockProvider);
      }
    }
  }, [user]);

  const addPortfolioItem = (imageSrc: string) => {
    if (!provider) return;

    const newPortfolioItem = {
      src: imageSrc,
      aiHint: 'new work',
    };

    const updatedProvider = {
      ...provider,
      portfolio: [...provider.portfolio, newPortfolioItem],
    };

    const allProviders = getProviders();
    const providerIndex = allProviders.findIndex(p => p.id === provider.id);

    if (providerIndex > -1) {
      allProviders[providerIndex] = updatedProvider;
      saveProviders(allProviders);
      setProvider(updatedProvider); // Update local state to re-render
      toast({
        title: 'موفقیت‌آمیز',
        description: 'نمونه کار جدید با موفقیت اضافه شد.',
      });
    } else {
        toast({
            title: 'خطا',
            description: 'اطلاعات هنرمند یافت نشد.',
            variant: 'destructive',
        })
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          addPortfolioItem(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!isLoggedIn) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
            <User className="w-24 h-24 text-muted-foreground mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">صفحه پروفایل</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                برای مشاهده پروفایل خود، لطفاً ابتدا وارد شوید.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/login">ورود به حساب کاربری</Link>
            </Button>
        </div>
     )
  }

  if (user?.accountType !== 'provider') {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
            <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">شما ارائه‌دهنده خدمات نیستید</h1>
            <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                این صفحه فقط برای ارائه‌دهندگان خدمات است. برای ثبت نام به عنوان هنرمند، به صفحه ثبت‌نام بروید.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/register">ثبت‌نام به عنوان هنرمند</Link>
            </Button>
        </div>
     )
  }
  
  if (!provider) {
    return <div>در حال بارگذاری پروفایل...</div>;
  }


  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20">
      <Card>
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 p-6 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
               {provider.portfolio && provider.portfolio.length > 0 ? (
                  <Image
                    src={provider.portfolio[0].src}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    data-ai-hint={provider.portfolio[0].aiHint}
                  />
                ) : (
                   <div className="bg-muted w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">{provider.name.charAt(0)}</span>
                  </div>
                )}
            </div>
            <CardTitle className="font-headline text-3xl">{provider.name}</CardTitle>
            <CardDescription className="text-lg">{provider.service}</CardDescription>
            <div className="mt-2">
                <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} />
            </div>
             <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 ml-2 text-accent" />
                <span>{provider.location}</span>
             </div>
          </div>
          <div className="md:col-span-2 p-6 md:border-r border-t md:border-t-0">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">درباره شما</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-foreground/80 leading-relaxed">{provider.bio}</p>
               <Separator className="my-6" />
                <div>
                  <h3 className="font-headline text-xl font-semibold mb-4">نمونه کارهای شما</h3>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button onClick={handleAddClick} variant="outline" className="w-full font-bold mb-6">
                    <PlusCircle className="w-5 h-5 ml-2" />
                    افزودن نمونه کار جدید
                  </Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {provider.portfolio.map((item, index) => (
                        <div key={index} className="overflow-hidden rounded-lg shadow-md aspect-w-1 aspect-h-1">
                            <Image 
                                src={item.src}
                                alt={`نمونه کار ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                                data-ai-hint={item.aiHint}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-6 bg-accent/20 p-4 rounded-lg">
                    <h4 className="font-bold text-accent-foreground">توجه:</h4>
                    <p className="text-sm text-accent-foreground/90">این یک صفحه آزمایشی است. در نسخه نهایی، شما قادر به ویرایش کامل پروفایل و آپلود نمونه کارهای واقعی خود خواهید بود.</p>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button asChild className="w-full">
                    <Link href="/inbox">
                        <Inbox className="w-4 h-4 ml-2" />
                        مشاهده صندوق ورودی
                    </Link>
                </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}
