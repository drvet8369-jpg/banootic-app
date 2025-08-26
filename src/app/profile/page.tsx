
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
import { getProviderByPhone, updateProviderDetails, updateProviderPortfolio, updateProviderProfileImage } from '@/lib/api';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Helper to convert a data URL to a File object for uploading
function dataURLtoFile(dataurl: string, filename: string): File | null {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}


export default function ProfilePage() {
  const { user, isLoggedIn, logout, isLoading: isAuthLoading } = useAuth();
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
            } else {
                 toast({ title: "خطا", description: "پروفایل هنرمند یافت نشد.", variant: "destructive" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "امکان بارگذاری اطلاعات پروفایل وجود ندارد.";
            toast({ title: "خطا", description: errorMessage, variant: "destructive" });
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
        toast({ title: "موفق", description: "اطلاعات شما با موفقیت به‌روز شد."});
        setMode('viewing');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی اطلاعات.';
        toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
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

  const handleImageResizeAndUpload = (file: File, callback: (file: File) => Promise<void>) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageSrc = e.target?.result as string;
        const img = document.createElement('img');
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > 800) {
              width *= 800 / height;
              height = 800;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const imageFile = dataURLtoFile(compressedDataUrl, file.name);
            if (!imageFile) {
              toast({title: 'خطا', description: 'خطا در تبدیل تصویر.', variant: 'destructive'});
              return;
            }
            await callback(imageFile);
          }
        };
        img.src = imageSrc;
      };
      reader.readAsDataURL(file);
  }

  const uploadProfilePicture = async (file: File) => {
      if (!user || !user.phone) {
          toast({ title: 'خطا', description: 'کاربر شناسایی نشد. لطفاً دوباره وارد شوید.', variant: 'destructive'});
          return;
      }
      setIsSaving(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phone', user.phone);
        
        const response = await fetch('/api/upload-profile-pic', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'خطای سرور در آپلود عکس پروفایل.');
        }

        setProvider(result);
        toast({ title: 'موفق', description: 'عکس پروفایل با موفقیت آپلود شد.' });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناس در آپلود.';
        toast({ title: 'خطا در آپلود', description: errorMessage, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
  }

  const uploadPortfolioImage = async (file: File) => {
    if (!user || !user.phone) {
        toast({ title: 'خطا', description: 'کاربر شناسایی نشد. لطفاً دوباره وارد شوید.', variant: 'destructive'});
        return;
    }
    setIsSaving(true);
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phone', user.phone);

        const response = await fetch('/api/upload-portfolio-item', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'خطای سرور در افزودن نمونه کار.');
        }
        
        setProvider(result);
        toast({ title: 'موفق', description: 'نمونه کار جدید با موفقیت اضافه شد.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطای ناشناس در آپلود نمونه کار.';
        toast({ title: 'خطا در آپلود', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDeletePortfolioItem = async (itemIndex: number) => {
    if (!provider || !user) return;
    setIsSaving(true);
    try {
        const updatedPortfolio = (provider.portfolio || []).filter((_, index) => index !== itemIndex);
        const updatedProvider = await updateProviderPortfolio(user.phone, updatedPortfolio);
        setProvider(updatedProvider);
        toast({ title: 'موفق', description: 'نمونه کار حذف شد.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطا در حذف نمونه کار.';
        toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user || !provider?.profile_image?.src) {
        toast({ title: "توجه", description: "عکسی برای حذف وجود ندارد.", variant: "default" });
        return;
    }
    setIsSaving(true);
    try {
        const updatedProvider = await updateProviderProfileImage(user.phone, { src: '', ai_hint: '' });
        setProvider(updatedProvider);
        toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت حذف شد.' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطا در حذف عکس پروفایل.';
        toast({ title: 'خطا', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const onPortfolioFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      handleImageResizeAndUpload(file, uploadPortfolioImage);
      e.target.value = '';
    }
  }
  
  const onProfilePicFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      handleImageResizeAndUpload(file, uploadProfilePicture);
      e.target.value = '';
    }
  }

  const handleAddPortfolioClick = () => { portfolioFileInputRef.current?.click(); };
  const handleEditProfilePicClick = () => { profilePicInputRef.current?.click(); }
  
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
                اطلاعات پروفایل شما در پایگاه داده یافت نشد. این ممکن است به دلیل یک خطای موقت باشد. لطفاً از حساب خود خارج شده و دوباره وارد شوید.
            </p>
            <Button onClick={() => logout()} size="lg" className="mt-8">خروج</Button>
        </div>
      )
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 py-12 md:py-20 flex-grow">
        {/* Right Column: Profile Card */}
        <div className="md:w-1/3 lg:w-1/4 md:sticky md:top-24 h-fit">
            <Card className="relative overflow-hidden">
                {isSaving && (
                  <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                )}
                <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
                        {provider.profile_image && provider.profile_image.src ? (
                            <Image
                                src={provider.profile_image.src}
                                alt={provider.name}
                                fill
                                className="object-cover"
                                data-ai-hint={provider.profile_image.ai_hint}
                                key={provider.profile_image.src}
                            />
                        ) : (
                            <div className="bg-muted w-full h-full flex items-center justify-center">
                                <User className="w-16 h-16 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    
                    <div className="w-full">
                       {mode === 'editing' ? (
                          <UiInput name="name" value={editedData.name} onChange={handleEditInputChange} className="text-center font-headline text-2xl mb-1" />
                        ) : (
                            <h1 className="font-headline text-2xl">{provider.name}</h1>
                        )}
                         {mode === 'editing' ? (
                            <UiInput name="service" value={editedData.service} onChange={handleEditInputChange} className="text-center text-lg text-muted-foreground" />
                        ) : (
                            <p className="text-lg text-muted-foreground">{provider.service}</p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 ml-2 text-accent" />
                        <span>{provider.location}</span>
                    </div>

                    <Separator className="my-6" />
                    
                    <h3 className="font-semibold mb-2 self-start">درباره شما</h3>
                    {mode === 'editing' ? (
                        <UiTextarea name="bio" value={editedData.bio} onChange={handleEditInputChange} className="text-base text-foreground/80 leading-relaxed w-full" rows={5} />
                    ) : (
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap text-right w-full">{provider.bio}</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 p-4 border-t">
                    {mode === 'editing' ? (
                        <>
                            <div className="grid grid-cols-2 gap-2 w-full">
                               <Button onClick={handleEditProfilePicClick} variant="outline" className="w-full">
                                    <Camera className="w-4 h-4 ml-2" />
                                    عکس
                                </Button>
                                <Button onClick={handleDeleteProfilePicture} variant="outline" className="w-full">
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف عکس
                                </Button>
                            </div>
                            <Button onClick={handleSaveChanges} className="w-full">
                                <Save className="w-4 h-4 ml-2" />
                                ذخیره تغییرات
                            </Button>
                            <Button onClick={handleCancelEdit} variant="ghost" className="w-full">
                                لغو
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => setMode('editing')} className="w-full">
                                <Edit className="w-4 h-4 ml-2" />
                                ویرایش اطلاعات
                            </Button>
                            <Button asChild className="w-full" variant="secondary">
                                <Link href={`/provider/${provider.phone}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    مشاهده پروفایل عمومی
                                </Link>
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>

        {/* Left Column: Main Content */}
        <div className="flex-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">مدیریت نمونه کارها</CardTitle>
                    <CardDescription>
                       نمونه‌کارهای خود را برای نمایش به مشتریان در اینجا مدیریت کنید.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <input 
                        type="file" 
                        ref={portfolioFileInputRef} 
                        onChange={onPortfolioFileSelected}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        disabled={isSaving}
                    />
                    <input
                        type="file"
                        ref={profilePicInputRef}
                        onChange={onProfilePicFileSelected}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        disabled={isSaving}
                    />
                     <Button onClick={handleAddPortfolioClick} size="lg" className="w-full font-bold" disabled={isSaving || mode === 'editing'}>
                        <PlusCircle className="w-5 h-5 ml-2" />
                        افزودن نمونه کار جدید
                   </Button>
                   
                   {provider.portfolio && provider.portfolio.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            {provider.portfolio.map((item, index) => (
                                <div 
                                    key={`${item.src}-${index}`}
                                    className="group relative w-full aspect-square overflow-hidden rounded-lg shadow-md"
                                >
                                    <Image
                                        src={item.src}
                                        alt={`نمونه کار ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={item.ai_hint}
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={() => handleDeletePortfolioItem(index)}
                                        aria-label={`حذف نمونه کار ${index + 1}`}
                                        disabled={isSaving || mode === 'editing'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg mt-6">
                            <p className="text-muted-foreground">هنوز نمونه کاری اضافه نکرده‌اید.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Other management cards can go here */}
        </div>
    </div>
  );
}
