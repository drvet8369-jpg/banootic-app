
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { MapPin, User, AlertTriangle, PlusCircle, Trash2, Camera, Edit, Save, XCircle, Loader2, Handshake, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import type { Provider } from '@/lib/types';
import { getProviders, saveProviders } from '@/lib/storage';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/ui/star-rating';

export default function ProfilePage() {
  const { user, isLoggedIn, updateUser, isAuthLoading } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [editedData, setEditedData] = useState({ name: '', service: '', bio: '' });
  const [isLoading, setIsLoading] = useState(true);

  const loadProviderData = useCallback(() => {
    if (user && user.accountType === 'provider' && user.phone) {
        const allProviders = getProviders();
        let currentProvider = allProviders.find(p => p.phone === user.phone);
        
        if (currentProvider) {
            setProvider(currentProvider);
            setEditedData({
                name: currentProvider.name,
                service: currentProvider.service,
                bio: currentProvider.bio || '',
            });
        }
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) return;
    setIsLoading(true);
    loadProviderData();
  }, [loadProviderData, isAuthLoading]);


  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({...prev, [name]: value}));
  }

  const handleSaveChanges = () => {
    if(!editedData.name.trim() || !editedData.service.trim() || !editedData.bio.trim()){
        toast({ title: "خطا", description: "تمام فیلدها باید پر شوند.", variant: "destructive"});
        return;
    }

    if (!user) return;
    
    let userWasUpdated = false;
    const allProviders = getProviders();
    const providerIndex = allProviders.findIndex((p: Provider) => p.phone === user.phone);

    if (providerIndex > -1) {
        if(user.name !== editedData.name){
            userWasUpdated = true;
        }
        allProviders[providerIndex].name = editedData.name;
        allProviders[providerIndex].service = editedData.service;
        allProviders[providerIndex].bio = editedData.bio;
        
        saveProviders(allProviders);
        
        if (userWasUpdated) {
            updateUser({ name: editedData.name });
        }
        
        loadProviderData();
        toast({ title: "موفق", description: "اطلاعات شما با موفقیت به‌روز شد."});
        setMode('viewing');

    } else {
        toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
    }
  }

  const handleCancelEdit = () => {
    if (provider) {
       setEditedData({
            name: provider.name,
            service: provider.service,
            bio: provider.bio,
        });
    }
    setMode('viewing');
  }


  const handleImageResizeAndSave = (file: File, callback: (dataUrl: string) => void) => {
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
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            callback(compressedDataUrl);
          } else {
            callback(imageSrc);
          }
        };
        img.src = imageSrc;
      };
      reader.readAsDataURL(file);
  }

  const updateProviderData = (updateFn: (provider: Provider) => void) => {
    if (!user) return false;
    const allProviders = getProviders();
    const providerIndex = allProviders.findIndex((p: Provider) => p.phone === user.phone);

    if (providerIndex > -1) {
      updateFn(allProviders[providerIndex]);
      saveProviders(allProviders);
      loadProviderData();
      return true;
    }
    return false;
  }

  const addPortfolioItem = (imageSrc: string) => {
    const success = updateProviderData((p) => {
      if (!p.portfolio) p.portfolio = [];
      p.portfolio.push({ src: imageSrc, aiHint: 'new work' });
    });
    if (success) {
      toast({ title: 'موفقیت‌آمیز', description: 'نمونه کار جدید با موفقیت اضافه شد.' });
    } else {
      toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
    }
  };
  
  const handleProfilePictureChange = (newImageSrc: string) => {
      const success = updateProviderData((p) => {
        if (!p.profileImage) p.profileImage = { src: '', aiHint: 'woman portrait' };
        p.profileImage.src = newImageSrc;
      });
      if (success) {
        toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت به‌روز شد.' });
      } else {
        toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
      }
  }

  const handleDeleteProfilePicture = () => {
    const success = updateProviderData((p) => {
      if (p.profileImage) p.profileImage.src = '';
    });
    if (success) {
      toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت حذف شد.' });
    } else {
      toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
    }
  };

  const handleAddPortfolioClick = () => {
    portfolioFileInputRef.current?.click();
  };
  
  const handleEditProfilePicClick = () => {
    profilePicInputRef.current?.click();
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageResizeAndSave(file, callback);
      event.target.value = '';
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mr-4">در حال بارگذاری پروفایل...</p>
      </div>
    );
  }
  
  if (!isLoggedIn) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32 flex-grow">
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

  if (user?.accountType !== 'provider' || !provider) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32 flex-grow">
            <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">پروفایل هنرمند یافت نشد</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                این صفحه فقط برای ارائه‌دهندگان خدمات است. اگر هنرمند هستید، لطفاً دوباره وارد شوید.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/register">ثبت‌نام به عنوان هنرمند</Link>
            </Button>
        </div>
     )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20 space-y-8 w-full">
      <Card>
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-l">
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
            {mode === 'editing' ? (
                 <UiInput name="name" value={editedData.name} onChange={handleEditInputChange} className="text-center font-headline text-3xl mb-1" />
            ) : (
                <CardTitle className="font-headline text-3xl">{provider.name}</CardTitle>
            )}
             {mode === 'editing' ? (
                 <UiInput name="service" value={editedData.service} onChange={handleEditInputChange} className="text-center text-lg text-muted-foreground" />
            ) : (
                <CardDescription className="text-lg">{provider.service}</CardDescription>
            )}

             <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 ml-2 text-accent" />
                <span>{provider.location}</span>
             </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} readOnly />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Handshake className="w-4 h-4" />
                    <span>{provider.agreementsCount || 0} توافق موفق</span>
                </div>
            </div>
          </div>
          <div className="md:col-span-2 p-6 flex flex-col">
            <CardHeader className="p-0 pb-4 flex flex-row justify-between items-center">
                <CardTitle className="font-headline text-2xl">
                    {mode === 'editing' ? 'ویرایش اطلاعات' : 'اطلاعات پروفایل'}
                </CardTitle>
                <Button onClick={() => mode === 'viewing' ? setMode('editing') : handleCancelEdit()} variant="ghost" size="icon">
                  {mode === 'viewing' ? <Edit className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex-grow">
              <div className="space-y-4">
                  <div>
                      <h3 className="font-semibold mb-2">درباره شما</h3>
                      {mode === 'editing' ? (
                          <UiTextarea name="bio" value={editedData.bio} onChange={handleEditInputChange} className="text-base text-foreground/80 leading-relaxed" rows={4} />
                      ) : (
                          <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{provider.bio}</p>
                      )}
                  </div>
                  {mode === 'viewing' && (
                    <Button asChild className="w-full">
                      <Link href={`/provider/${provider.phone}`}>
                        <Eye className="w-4 h-4 ml-2" />
                        مشاهده پروفایل عمومی
                      </Link>
                    </Button>
                  )}
              </div>
               <Separator className="my-6" />
                <div className="mb-4">
                  <h3 className="font-headline text-xl font-semibold mb-4">مدیریت نمونه کارها</h3>
                  
                  <input 
                    type="file" 
                    ref={portfolioFileInputRef} 
                    onChange={(e) => handleFileChange(e, addPortfolioItem)}
                    className="hidden"
                    accept="image/*"
                  />
                   <input
                    type="file"
                    ref={profilePicInputRef}
                    onChange={(e) => handleFileChange(e, handleProfilePictureChange)}
                    className="hidden"
                    accept="image/*"
                  />
                   <Button onClick={handleAddPortfolioClick} size="lg" className="w-full font-bold mb-6">
                        <PlusCircle className="w-5 h-5 ml-2" />
                        افزودن نمونه کار جدید
                   </Button>
                   <p className="text-xs text-center text-muted-foreground">برای حذف نمونه‌کارها، به پروفایل عمومی خود مراجعه کرده و روی دکمه سطل زباله کلیک کنید.</p>
                </div>
            </CardContent>
             {mode === 'editing' && (
                 <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 pt-6 border-t mt-auto">
                     <Button onClick={handleSaveChanges} className="w-full flex-1">
                        <Save className="w-4 h-4 ml-2" />
                        ذخیره تغییرات
                    </Button>
                     <Button onClick={handleEditProfilePicClick} variant="outline" className="w-full flex-1">
                        <Camera className="w-4 h-4 ml-2" />
                        تغییر عکس پروفایل
                    </Button>
                    <Button onClick={handleDeleteProfilePicture} variant="destructive" className="w-full flex-1">
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف عکس پروفایل
                    </Button>
                 </CardFooter>
             )}
          </div>
        </div>
      </Card>
    </div>
  );
}
