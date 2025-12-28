
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
import { MapPin, User, PlusCircle, Trash2, Camera, Edit, Save, XCircle } from 'lucide-react';
import type { Provider, PortfolioItem } from '@/lib/types';
import { addPortfolioItemAction, deletePortfolioItemAction, updateProviderInfoAction, updateProviderProfileImageAction, deleteProviderProfileImageAction } from './actions';


interface ProfileClientContentProps {
  providerData: {
    id: number;
    profile_id: string;
    name: string;
    location: string | null;
    bio: string | null;
    phone: string;
    service: string | null;
    category_slug: string | null;
    service_slug: string | null;
    rating: number | null;
    reviews_count: number | null;
    profile_image: { src: string; aiHint?: string; } | null;
    portfolio_items: { id: number; image_url: string; ai_hint: string | null; }[]
  };
}

export function ProfileClientContent({ providerData }: ProfileClientContentProps) {
  const router = useRouter();
  const [provider, setProvider] = useState(providerData);
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [editedData, setEditedData] = useState({
    name: provider.name || '',
    service: provider.service || '',
    bio: provider.bio || '',
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

    toast.loading("در حال ذخیره تغییرات...");
    const result = await updateProviderInfoAction(provider.id, editedData);
    toast.dismiss();

    if (result.error) {
      toast.error("خطا در به‌روزرسانی", { description: result.error });
    } else {
      toast.success("اطلاعات شما با موفقیت به‌روز شد.");
      setMode('viewing');
      router.refresh(); // Refresh server component data
    }
  };

  const handleCancelEdit = () => {
    setEditedData({
      name: provider.name,
      service: provider.service || '',
      bio: provider.bio || '',
    });
    setMode('viewing');
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, action: 'addPortfolio' | 'changeProfilePic') => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading("در حال آپلود و پردازش تصویر...");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        let result;
        if(action === 'addPortfolio') {
            result = await addPortfolioItemAction(provider.id, base64data);
        } else {
            result = await updateProviderProfileImageAction(provider.id, base64data);
        }

        toast.dismiss();
        if (result.error) {
            toast.error("خطا در آپلود تصویر", { description: result.error });
        } else {
            toast.success("تصویر با موفقیت افزوده شد.");
            router.refresh();
        }
    };
    event.target.value = ''; // Reset file input
  };
  
  const handleDeletePortfolioItem = async (portfolioItemId: number) => {
    if(!confirm("آیا از حذف این نمونه کار مطمئن هستید؟")) return;

    toast.loading("در حال حذف نمونه کار...");
    const result = await deletePortfolioItemAction(portfolioItemId);
    toast.dismiss();
    if(result.error) {
        toast.error("خطا در حذف", { description: result.error });
    } else {
        toast.success("نمونه کار حذف شد.");
        router.refresh();
    }
  }

  const handleDeleteProfilePicture = async () => {
      if(!confirm("آیا از حذف عکس پروفایل خود مطمئن هستید؟")) return;
      toast.loading("در حال حذف عکس پروفایل...");
      const result = await deleteProviderProfileImageAction(provider.id);
      toast.dismiss();
      if(result.error) {
         toast.error("خطا در حذف", { description: result.error });
      } else {
        toast.success("عکس پروفایل حذف شد.");
        router.refresh();
      }
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
                  data-ai-hint={provider.profile_image.aiHint}
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
                <input type="file" ref={portfolioFileInputRef} onChange={(e) => handleFileChange(e, 'addPortfolio')} className="hidden" accept="image/*" />
                <input type="file" ref={profilePicInputRef} onChange={(e) => handleFileChange(e, 'changeProfilePic')} className="hidden" accept="image/*" />
                <Button onClick={() => portfolioFileInputRef.current?.click()} size="lg" className="w-full font-bold mb-6">
                  <PlusCircle className="w-5 h-5 ml-2" />
                  افزودن نمونه کار جدید
                </Button>
                {/* Portfolio items are now rendered on the public profile page for deletion */}
                 <p className="text-xs text-center text-muted-foreground">برای حذف نمونه‌کارها، به پروفایل عمومی خود مراجعه کرده و روی دکمه سطل زباله کلیک کنید.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 pt-6 border-t mt-auto">
              {mode === 'editing' ? (
                <>
                  <Button onClick={handleSaveChanges} className="w-full flex-1"><Save className="w-4 h-4 ml-2" /> ذخیره تغییرات</Button>
                  <Button onClick={() => profilePicInputRef.current?.click()} variant="outline" className="w-full flex-1"><Camera className="w-4 h-4 ml-2" /> تغییر عکس پروفایل</Button>
                  <Button onClick={handleDeleteProfilePicture} variant="destructive" className="w-full flex-1"><Trash2 className="w-4 h-4 ml-2" /> حذف عکس پروفایل</Button>
                  <Button onClick={handleCancelEdit} variant="ghost" className="w-full flex-1 mt-2 sm:mt-0 sm:w-auto"><XCircle className="w-4 h-4 ml-2" /> لغو</Button>
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

    