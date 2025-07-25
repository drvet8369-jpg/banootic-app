
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, User, AlertTriangle, Inbox, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import type { Provider } from '@/lib/types';
import { getProviders, saveProviders } from '@/lib/data';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/ui/star-rating';

export default function ProfilePage() {
  const { user, isLoggedIn } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user && user.accountType === 'provider') {
      const allProviders = getProviders();
      let currentProvider = allProviders.find(p => p.phone === user.phone);
      
      if (currentProvider) {
        setProvider(currentProvider);
      } else {
        console.warn("Provider not found in list after login. This might indicate an issue.");
      }
    }
  }, [user]);

  const addPortfolioItem = (imageSrc: string) => {
    if (!user) return;

    const newPortfolioItem = {
      src: imageSrc,
      aiHint: 'new work',
    };
    
    const allProviders = getProviders();
    const updatedProvidersList = JSON.parse(JSON.stringify(allProviders));
    
    const providerIndex = updatedProvidersList.findIndex((p: Provider) => p.phone === user.phone);

    if (providerIndex > -1) {
      const updatedProvider = updatedProvidersList[providerIndex];
      
      if (!updatedProvider.portfolio) {
          updatedProvider.portfolio = [];
      }
      updatedProvider.portfolio.push(newPortfolioItem);
      
      saveProviders(updatedProvidersList);
      
      setProvider(updatedProvider);
      
      toast({
        title: 'موفقیت‌آمیز',
        description: 'نمونه کار جدید با موفقیت اضافه شد.',
      });
    } else {
      toast({
        title: 'خطا',
        description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.',
        variant: 'destructive',
      });
    }
  };

  const deletePortfolioItem = (itemIndex: number) => {
    if (!user) return;

    const allProviders = getProviders();
    const updatedProvidersList = JSON.parse(JSON.stringify(allProviders));
    const providerIndex = updatedProvidersList.findIndex((p: Provider) => p.phone === user.phone);

    if (providerIndex > -1) {
      const updatedProvider = updatedProvidersList[providerIndex];
      // Filter out the item to be deleted
      updatedProvider.portfolio = updatedProvider.portfolio.filter((_: any, index: number) => index !== itemIndex);
      
      saveProviders(updatedProvidersList);
      setProvider(updatedProvider);
      
      toast({
        title: 'موفقیت‌آمیز',
        description: 'نمونه کار با موفقیت حذف شد.',
      });
    } else {
       toast({
        title: 'خطا',
        description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.',
        variant: 'destructive',
      });
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
        const imageSrc = e.target?.result as string;
        
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Use JPEG format for better compression for photos
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8); 
            addPortfolioItem(compressedDataUrl);
          } else {
             // Fallback to original if canvas fails
             addPortfolioItem(imageSrc);
          }
        };
        img.src = imageSrc;
      };
      reader.readAsDataURL(file);
      // Reset file input to allow selecting the same file again
      event.target.value = '';
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
               {provider.profileImage && provider.profileImage.src ? (
                  <Image
                    src={provider.profileImage.src}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    data-ai-hint={provider.profileImage.aiHint}
                  />
                ) : (
                   <div className="bg-muted w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground" />
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
                <div className="mb-4">
                  <h3 className="font-headline text-xl font-semibold mb-4 text-center">نمونه کارهای شما</h3>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button onClick={handleAddClick} size="lg" className="w-full font-bold mb-6">
                    <PlusCircle className="w-5 h-5 ml-2" />
                    افزودن نمونه کار جدید
                  </Button>
                </div>
                 {provider.portfolio && provider.portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {provider.portfolio.map((item, index) => (
                          <div key={index} className="group relative overflow-hidden rounded-lg shadow-md aspect-w-1 aspect-h-1">
                            <Image 
                                src={item.src}
                                alt={`نمونه کار ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                                data-ai-hint={item.aiHint}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deletePortfolioItem(index)}
                              aria-label={`حذف نمونه کار ${index + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                      <p>هنوز نمونه کاری اضافه نکرده‌اید.</p>
                    </div>
                 )}
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button asChild className="w-full">
                    <Link href="/inbox">
                        <Inbox className="w-4 h-4 ml-2" />
                        مشاهده صندوق ورودی
                    </Link>
                </Button>
                 <Button asChild className="w-full" variant="secondary">
                    <Link href={`/provider/${provider.phone}`}>
                        <User className="w-4 h-4 ml-2" />
                        مشاهده پروفایل عمومی
                    </Link>
                </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}
