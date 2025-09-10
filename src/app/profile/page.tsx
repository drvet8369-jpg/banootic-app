'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { MapPin, User, AlertTriangle, PlusCircle, Trash2, Camera, Edit, Save, XCircle, Loader2, FileText, Handshake, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import type { Provider, PortfolioItem } from '@/lib/types';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateProviderDetails, updateProviderProfileImage, updateProviderPortfolio } from '@/lib/api';
import { dispatchCrossTabEvent } from '@/lib/events';


async function uploadFile(file: File, userId: string, endpoint: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'خطا در آپلود فایل.');
    }
    return data;
}


export default function ProfilePage() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [editedData, setEditedData] = useState({ name: '', service: '', bio: '' });

  useEffect(() => {
    if (user && user.account_type === 'provider' && user.provider_details) {
      setProvider(user.provider_details);
      setEditedData({
        name: user.provider_details.name,
        service: user.provider_details.service,
        bio: user.provider_details.bio,
      });
    }
  }, [user]);

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({...prev, [name]: value}));
  }

  const handleSaveChanges = async () => {
    if(!user || !provider) return;
    if(!editedData.name.trim() || !editedData.service.trim() || !editedData.bio.trim()){
        toast({ title: "خطا", description: "تمام فیلدها باید پر شوند.", variant: "destructive"});
        return;
    }
    
    try {
        const detailsToUpdate = { ...editedData, phone: provider.phone };
        const updatedProvider = await updateProviderDetails(user.id, detailsToUpdate);
        setProvider(updatedProvider);
        dispatchCrossTabEvent('profile-update', { userId: user.id });
        toast({ title: "موفق", description: "اطلاعات شما با موفقیت به‌روز شد."});
        setMode('viewing');
    } catch (e: any) {
        toast({ title: "خطا", description: e.message || "خطا در به‌روزرسانی اطلاعات.", variant: "destructive"});
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, type: 'profile' | 'portfolio') => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      if (type === 'profile') {
        const updatedProvider = await uploadFile(file, user.id, '/api/upload-profile-pic');
        setProvider(updatedProvider);
        toast({ title: 'موفق', description: 'عکس پروفایل شما با موفقیت به‌روز شد.' });
      } else {
        const updatedProvider = await uploadFile(file, user.id, '/api/upload-portfolio-item');
        setProvider(updatedProvider);
        toast({ title: 'موفق', description: 'نمونه کار جدید با موفقیت اضافه شد.' });
      }
      dispatchCrossTabEvent('profile-update', { userId: user.id });
    } catch (error: any) {
      toast({ title: 'خطا در آپلود', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      // Reset file input value
      if (event.target) event.target.value = '';
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user || !provider) return;
    try {
      const updatedProvider = await updateProviderProfileImage(user.id, { src: '', ai_hint: 'woman portrait' });
      setProvider(updatedProvider);
      dispatchCrossTabEvent('profile-update', { userId: user.id });
      toast({ title: 'موفق', description: 'عکس پروفایل شما با موفقیت حذف شد.' });
    } catch (e: any) {
       toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    }
  };

  if (isAuthLoading) {
      return <div className="flex justify-center items-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
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
                <Link href="/auth/login">ورود به حساب کاربری</Link>
            </Button>
        </div>
     )
  }

  if (user?.account_type !== 'provider' || !provider) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32 flex-grow">
            <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">شما هنرمند نیستید</h1>
            <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                این صفحه فقط برای هنرمندان است. اگر فکر می‌کنید این یک اشتباه است، لطفاً دوباره وارد شوید.
            </p>
        </div>
     )
  }
  
  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20 space-y-8">
      <Card>
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-l">
             <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
               {provider.profile_image && provider.profile_image.src ? (
                  <Image
                    src={provider.profile_image.src}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    data-ai-hint={provider.profile_image.ai_hint}
                    sizes="(max-width: 768px) 128px, 192px"
                  />
                ) : (
                   <div className="bg-muted w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                 {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}
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
                  <input type="file" ref={portfolioFileInputRef} onChange={(e) => handleFileChange(e, 'portfolio')} className="hidden" accept="image/*" disabled={isUploading}/>
                  <input type="file" ref={profilePicInputRef} onChange={(e) => handleFileChange(e, 'profile')} className="hidden" accept="image/*" disabled={isUploading}/>
                  <Button onClick={() => portfolioFileInputRef.current?.click()} size="lg" className="w-full font-bold mb-6" disabled={isUploading}>
                        {isUploading ? <Loader2 className="w-5 h-5 ml-2 animate-spin"/> : <PlusCircle className="w-5 h-5 ml-2" />}
                        افزودن نمونه کار جدید
                   </Button>
                   <p className="text-xs text-center text-muted-foreground">برای حذف نمونه‌کارها، به پروفایل عمومی خود مراجعه کرده و روی دکمه سطل زباله کلیک کنید.</p>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 pt-6 border-t mt-auto">
                {mode === 'editing' ? (
                    <>
                         <Button onClick={handleSaveChanges} className="w-full flex-1">
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تغییرات
                        </Button>
                         <Button onClick={() => profilePicInputRef.current?.click()} variant="outline" className="w-full flex-1" disabled={isUploading}>
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
                           <Link href="/agreements">
                             <Handshake className="w-4 h-4 ml-2" />
                              توافق‌ها
                           </Link>
                        </Button>
                        <Button asChild className="w-full flex-1" variant="secondary">
                            <Link href={`/provider/${provider.phone}`}>
                                <Eye className="w-4 h-4 ml-2"/>
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
