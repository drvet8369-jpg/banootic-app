'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, PlusCircle, Trash2, Camera, Edit, Save, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { 
  updateProviderInfoAction, 
  addPortfolioItemAction, 
  updateProviderProfileImageAction, 
  deleteProviderProfileImageAction, 
  deletePortfolioItemAction,
  generateBioAction
} from './actions';
import type { Provider } from '@/lib/types';


interface ProfileClientContentProps {
  providerData: Provider;
}

export function ProfileClientContent({ providerData }: ProfileClientContentProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [editedData, setEditedData] = useState({
    name: providerData.name || '',
    service: providerData.service || '',
    bio: providerData.bio || '',
  });

  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!editedData.name.trim() || !editedData.service.trim() || !editedData.bio.trim()) {
      toast.error("تمام فیلدها باید پر شوند.");
      return;
    }

    setIsSubmitting(true);
    toast.loading("در حال ذخیره تغییرات...");
    const result = await updateProviderInfoAction(editedData);
    toast.dismiss();

    if (result.error) {
      toast.error("خطا در به‌روزرسانی", { description: result.error });
    } else {
      toast.success("اطلاعات شما با موفقیت به‌روز شد.");
      setMode('viewing');
      router.refresh(); // Refresh server-fetched props
    }
    setIsSubmitting(false);
  };
  
    const handleGenerateBio = async () => {
    if (!editedData.name || !editedData.service) {
      toast.error("اطلاعات ناقص", { description: "لطفاً ابتدا نام و نوع خدمت را وارد کنید." });
      return;
    }
    setIsGeneratingBio(true);
    toast.loading("در حال پردازش...", {description: "دستیار هوش مصنوعی در حال نوشتن بیوگرافی است."});

    const result = await generateBioAction({
        providerName: editedData.name,
        serviceType: editedData.service,
    });
    toast.dismiss();
    
    if (result.error) {
        toast.error("خطا در تولید بیوگرافی", { description: result.error });
    } else if (result.biography) {
        setEditedData(prev => ({...prev, bio: result.biography!}));
        toast.success("موفق", { description: "بیوگرافی جدید در کادر زیر قرار گرفت. می‌توانید آن را ویرایش کنید." });
    }
    setIsGeneratingBio(false);
  };

  const handleCancelEdit = () => {
    setEditedData({
      name: providerData.name,
      service: providerData.service || '',
      bio: providerData.bio || '',
    });
    setMode('viewing');
  };

  const resizeAndCallback = (file: File, callback: (dataUrl: string) => void) => {
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
            callback(canvas.toDataURL('image/jpeg', 0.8));
          }
        };
        img.src = imageSrc;
      };
      reader.readAsDataURL(file);
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, actionType: 'addPortfolio' | 'changeProfilePic') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    toast.loading("در حال آپلود و پردازش تصویر...");

    resizeAndCallback(file, async (base64data) => {
        let result;
        if(actionType === 'addPortfolio') {
            result = await addPortfolioItemAction(base64data);
        } else {
            result = await updateProviderProfileImageAction(base64data);
        }

        toast.dismiss();
        if (result.error) {
            toast.error("خطا در آپلود تصویر", { description: result.error });
        } else {
            toast.success("تصویر با موفقیت افزوده شد.");
            router.refresh();
        }
        setIsSubmitting(false);
    });
    event.target.value = '';
  };
  
  const handleDeleteProfilePicture = async () => {
      if(!confirm("آیا از حذف عکس پروفایل خود مطمئن هستید؟")) return;
      setIsSubmitting(true);
      toast.loading("در حال حذف عکس پروفایل...");
      const result = await deleteProviderProfileImageAction();
      toast.dismiss();
      if(result.error) {
         toast.error("خطا در حذف", { description: result.error });
      } else {
        toast.success("عکس پروفایل حذف شد.");
        router.refresh();
      }
      setIsSubmitting(false);
  }

  const handleDeletePortfolioItem = async (itemSrc: string) => {
    if(!confirm("آیا از حذف این نمونه کار مطمئن هستید؟")) return;

    setIsSubmitting(true);
    toast.loading("در حال حذف نمونه کار...");
    const result = await deletePortfolioItemAction(itemSrc);
    toast.dismiss();

    if(result.error) {
        toast.error("خطا در حذف", { description: result.error });
    } else {
        toast.success("نمونه کار حذف شد.");
        router.refresh();
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <div className="grid md:grid-cols-3">
        <div className="md:col-span-1 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-l">
          <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
            {providerData.profileImage && providerData.profileImage.src ? (
              <Image
                src={providerData.profileImage.src}
                alt={providerData.name}
                fill
                className="object-cover"
                data-ai-hint={providerData.profileImage.aiHint}
                key={providerData.profileImage.src} // Force re-render on src change
              />
            ) : (
              <div className="bg-muted w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {mode === 'editing' ? (
            <UiInput name="name" value={editedData.name} onChange={handleEditInputChange} className="text-center font-headline text-2xl mb-1" disabled={isSubmitting}/>
          ) : (
            <CardTitle className="font-headline text-2xl">{providerData.name}</CardTitle>
          )}
          {mode === 'editing' ? (
            <UiInput name="service" value={editedData.service} onChange={handleEditInputChange} className="text-center text-lg text-muted-foreground" disabled={isSubmitting}/>
          ) : (
            <CardDescription className="text-lg">{providerData.service}</CardDescription>
          )}
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 ml-2 text-accent" />
            <span>{providerData.location}</span>
          </div>
        </div>
        <div className="md:col-span-2 p-6 flex flex-col">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="font-headline text-xl">داشبورد مدیریت</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">درباره شما</h3>
                {mode === 'editing' && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateBio}
                        disabled={isGeneratingBio || isSubmitting}
                    >
                        {isGeneratingBio ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2" />}
                        نوشتن با هوش مصنوعی
                    </Button>
                )}
              </div>
            {mode === 'editing' ? (
              <UiTextarea name="bio" value={editedData.bio} onChange={handleEditInputChange} className="text-base text-foreground/80 leading-relaxed" rows={4} disabled={isSubmitting}/>
            ) : (
              <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{providerData.bio}</p>
            )}
            <Separator className="my-6" />
            
            <div className="mb-4">
              <h3 className="font-headline text-xl font-semibold mb-4">مدیریت نمونه کارها</h3>
              <input type="file" ref={portfolioFileInputRef} onChange={(e) => handleFileChange(e, 'addPortfolio')} className="hidden" accept="image/*" />
              <input type="file" ref={profilePicInputRef} onChange={(e) => handleFileChange(e, 'changeProfilePic')} className="hidden" accept="image/*" />
              
              <Button onClick={() => portfolioFileInputRef.current?.click()} size="lg" className="w-full font-bold mb-6" disabled={isSubmitting}>
                <PlusCircle className="w-5 h-5 ml-2" />
                افزودن نمونه کار جدید
              </Button>

              {providerData.portfolio && providerData.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {providerData.portfolio.map((item, index) => (
                    <div key={index} className="group relative w-full aspect-square overflow-hidden rounded-lg shadow-md">
                      <Image
                          src={item.src}
                          alt={`نمونه کار ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint={item.aiHint || ''}
                          key={item.src}
                      />
                      <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={() => handleDeletePortfolioItem(item.src)}
                          disabled={isSubmitting}
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
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 pt-6 border-t mt-auto">
            {mode === 'editing' ? (
              <>
                <Button onClick={handleSaveChanges} className="w-full flex-1" disabled={isSubmitting}><Save className="w-4 h-4 ml-2" /> ذخیره تغییرات</Button>
                <Button onClick={() => profilePicInputRef.current?.click()} variant="outline" className="w-full flex-1" disabled={isSubmitting}><Camera className="w-4 h-4 ml-2" /> تغییر عکس پروفایل</Button>
                <Button onClick={handleDeleteProfilePicture} variant="destructive" className="w-full flex-1" disabled={isSubmitting}><Trash2 className="w-4 h-4 ml-2" /> حذف عکس پروفایل</Button>
                <Button onClick={handleCancelEdit} variant="ghost" className="w-full flex-1 mt-2 sm:mt-0 sm:w-auto" disabled={isSubmitting}><XCircle className="w-4 h-4 ml-2" /> لغو</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setMode('editing')} className="w-full flex-1"><Edit className="w-4 h-4 ml-2" /> ویرایش اطلاعات</Button>
                <Button asChild className="w-full flex-1">
                  <Link href="/inbox">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    صندوق ورودی
                  </Link>
                </Button>
                <Button asChild className="w-full flex-1" variant="secondary">
                  <Link href={`/provider/${providerData.phone}`}>
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
  );
}
