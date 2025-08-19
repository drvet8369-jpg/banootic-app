'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { MapPin, User, AlertTriangle, PlusCircle, Trash2, Camera, Edit, Save, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import type { Provider, PortfolioItem } from '@/lib/types';
import { getProviderByPhone, updateProviderDetails, addPortfolioItem, deletePortfolioItem as apiDeletePortfolioItem, updateProviderProfileImage } from '@/lib/api';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isLoggedIn, login, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [editedData, setEditedData] = useState({ name: '', service: '', bio: '' });

  const loadProviderData = useCallback(async () => {
    if (user && user.accountType === 'provider') {
        setIsLoading(true);
        try {
            const currentProvider = await getProviderByPhone(user.phone);
            if (currentProvider) {
                setProvider(currentProvider);
                setEditedData({
                    name: currentProvider.name,
                    service: currentProvider.service,
                    bio: currentProvider.bio,
                });
            }
        } catch (error) {
            toast({ title: "خطا", description: "امکان بارگذاری اطلاعات پروفایل وجود ندارد.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    } else {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!isAuthLoading) {
       loadProviderData();
    }
  }, [loadProviderData, isAuthLoading]);


  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({...prev, [name]: value}));
  }

  const handleSaveChanges = async () => {
    if(!user || !editedData.name.trim() || !editedData.service.trim() || !editedData.bio.trim()){
        toast({ title: "خطا", description: "تمام فیلدها باید پر شوند.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    try {
        const updatedProvider = await updateProviderDetails(user.phone, editedData);
        setProvider(updatedProvider);
        
        if (user.name !== editedData.name) {
            const updatedUser = { ...user, name: editedData.name };
            login(updatedUser); 
        }

        toast({ title: "موفق", description: "اطلاعات شما با موفقیت به‌روز شد."});
        setMode('viewing');
    } catch (error) {
        toast({ title: 'خطا', description: 'خطا در به‌روزرسانی اطلاعات.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
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
      setIsSaving(true);
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
      reader.onerror = () => {
          setIsSaving(false);
          toast({title: 'خطا', description: 'خطا در خواندن فایل تصویر.', variant: 'destructive'})
      }
      reader.readAsDataURL(file);
  }

  const handleAddPortfolioItem = async (imageSrc: string) => {
    if (!user) return;
    const newItem: PortfolioItem = { src: imageSrc, aiHint: 'new work' };
    try {
      const updatedProvider = await addPortfolioItem(user.phone, newItem);
      setProvider(updatedProvider);
      toast({ title: 'موفقیت‌آمیز', description: 'نمونه کار جدید با موفقیت اضافه شد.' });
    } catch (error) {
       toast({ title: 'خطا', description: 'خطا در افزودن نمونه کار.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const deletePortfolioItem = async (itemIndex: number) => {
    if (!provider || !user || user.phone !== provider.phone) return;
    
    setIsSaving(true);
    try {
      const updatedProvider = await apiDeletePortfolioItem(user.phone, itemIndex);
      setProvider(updatedProvider);
      toast({ title: 'موفق', description: 'نمونه کار حذف شد.' });
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در حذف نمونه کار.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleProfilePictureChange = async (newImageSrc: string) => {
      if (!user) return;
      try {
        const updatedProvider = await updateProviderProfileImage(user.phone, { src: newImageSrc, aiHint: 'woman portrait' });
        setProvider(updatedProvider);
        toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت به‌روز شد.' });
      } catch (error) {
        toast({ title: 'خطا', description: 'خطا در به‌روزرسانی عکس پروفایل.', variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
  }

  const handleDeleteProfilePicture = async () => {
    if(!user) return;
    setIsSaving(true);
    try {
      const updatedProvider = await updateProviderProfileImage(user.phone, { src: '', aiHint: 'woman portrait' });
      setProvider(updatedProvider);
      toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت حذف شد.' });
    } catch (error) {
      toast({ title: 'خطا', description: 'خطا در حذف عکس پروفایل.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddPortfolioClick = () => { portfolioFileInputRef.current?.click(); };
  const handleEditProfilePicClick = () => { profilePicInputRef.current?.click(); }
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageResizeAndSave(file, callback);
      event.target.value = '';
    }
  };
  
  if (isAuthLoading || isLoading) {
    return <div className="flex justify-center items-center py-20 flex-grow"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
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

  if (user?.accountType !== 'provider') {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32 flex-grow">
            <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">شما ارائه‌دهنده خدمات نیستید</h1>
            <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                این صفحه فقط برای ارائه‌دهندگان خدمات است.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/register">ثبت‌نام به عنوان هنرمند</Link>
            </Button>
        </div>
     )
  }
  
  if (!provider) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32 flex-grow">
             <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
             <h1 className="font-display text-4xl md:text-5xl font-bold">پروفایل یافت نشد</h1>
             <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                اطلاعات پروفایل شما در پایگاه داده یافت نشد. لطفاً با پشتیبانی تماس بگیرید.
            </p>
        </div>
      )
  }

  return (
    <div className="w-full py-12 md:py-20 space-y-8 flex justify-center">
      <Card className="w-full max-w-4xl relative">
         {isSaving && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-lg">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
         )}
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
          </div>
          <div className="md:col-span-2 p-6 flex flex-col">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="font-headline text-2xl">داشبورد مدیریت</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow">
              <h3 className="font-semibold mb-2">درباره شما</h3>
              {mode === 'editing' ? (
                  <UiTextarea name="bio" value={editedData.bio} onChange={handleEditInputChange} className="text-base text-foreground/80 leading-relaxed" rows={4} />
              ) : (
                  <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{provider.bio}</p>
              )}
               <Separator className="my-6" />
                <div className="mb-4">
                  <h3 className="font-headline text-xl font-semibold mb-4">مدیریت نمونه کارها</h3>
                  <input 
                    type="file" 
                    ref={portfolioFileInputRef} 
                    onChange={(e) => handleFileChange(e, handleAddPortfolioItem)}
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
                   
                   {provider.portfolio && provider.portfolio.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {provider.portfolio.map((item, index) => (
                                <div 
                                    key={`portfolio-item-${index}`}
                                    className="group relative w-full aspect-square overflow-hidden rounded-lg shadow-md"
                                >
                                    <Image
                                        src={item.src}
                                        alt={`نمونه کار ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={item.aiHint}
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={() => deletePortfolioItem(index)}
                                        aria-label={`حذف نمونه کار ${index + 1}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground mt-4">هنوز نمونه کاری اضافه نکرده‌اید.</p>
                    )}
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 pt-6 border-t mt-auto">
                {mode === 'editing' ? (
                    <>
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
                        <Button onClick={handleCancelEdit} variant="ghost" className="w-full flex-1 mt-2 sm:mt-0 sm:w-auto">
                            <XCircle className="w-4 h-4 ml-2" />
                            لغو
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => setMode('editing')} className="w-full flex-1">
                            <Edit className="w-4 h-4 ml-2" />
                            ویرایش اطلاعات
                        </Button>
                         <Button asChild className="w-full flex-1">
                            <Link href="/inbox">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                                صندوق ورودی
                            </Link>
                        </Button>
                        <Button asChild className="w-full flex-1" variant="secondary">
                            <Link href={`/provider/${provider.phone}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                مشاهده پروفایل عمومی
                            </Link>
                        </Button>
                    </>
                )}
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}
