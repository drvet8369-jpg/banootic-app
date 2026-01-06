
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { deletePortfolioItemAction } from './actions';
import type { Provider } from '@/lib/types';

interface PortfolioGalleryProps {
    isOwner: boolean;
    provider: Provider;
}

export function PortfolioGallery({ provider, isOwner }: PortfolioGalleryProps) {
    const router = useRouter();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, itemSrc: string) => {
        e.stopPropagation();
        if(!confirm("آیا از حذف این نمونه کار مطمئن هستید؟")) return;

        toast.loading("در حال حذف نمونه کار...");
        const result = await deletePortfolioItemAction(itemSrc);
        toast.dismiss();
        if(result.error) {
            toast.error("خطا در حذف", { description: result.error });
        } else {
            toast.success("نمونه کار حذف شد.");
            router.refresh();
        }
    };
    
    if (!provider.portfolio || provider.portfolio.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>هنوز نمونه کاری اضافه نشده است.</p>
            </div>
        );
    }

    return (
        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {provider.portfolio.map((item, index) => (
                    <DialogTrigger asChild key={index}>
                        <div 
                            className="group relative w-full aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                            onClick={() => setSelectedImage(item.src)}
                        >
                            <Image
                                src={item.src}
                                alt={`نمونه کار ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={item.aiHint || ''}
                                key={item.src}
                            />
                            {isOwner && (
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => handleDelete(e, item.src)}
                                aria-label={`حذف نمونه کار ${index + 1}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            )}
                        </div>
                    </DialogTrigger>
                ))}
            </div>
            
            <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 flex items-center justify-center bg-black/80 border-0 shadow-none rounded-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>نمونه کار تمام صفحه</DialogTitle>
                </DialogHeader>
                <DialogClose className="absolute right-4 top-4 rounded-full p-2 bg-black/50 text-white opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none z-50">
                    <X className="h-6 w-6" />
                    <span className="sr-only">بستن</span>
                </DialogClose>
                {selectedImage && (
                    <div className="relative w-full h-full">
                        <Image
                            src={selectedImage}
                            alt="نمونه کار تمام صفحه"
                            fill
                            className="object-contain"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
