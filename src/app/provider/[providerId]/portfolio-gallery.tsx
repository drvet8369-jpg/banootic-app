
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { X } from 'lucide-react';
import type { Provider } from '@/lib/types';

interface PortfolioGalleryProps {
    provider: Provider;
}

export function PortfolioGallery({ provider }: PortfolioGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
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
