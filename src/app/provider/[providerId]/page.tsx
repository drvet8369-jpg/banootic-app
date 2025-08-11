
'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Provider, Review } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import { Loader2, MessageSquare, Phone, User, Send, Star, Trash2, X, Handshake } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Reusable Avatar components for ReviewCard
const Avatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
);

const AvatarFallback = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)} {...props} />
);

// Review Card Component
const ReviewCard = ({ review }: { review: Review }) => (
  <div className="flex flex-col sm:flex-row gap-4 p-4 border-b">
    <div className="flex-shrink-0 flex sm:flex-col items-center gap-2 text-center w-24">
      <Avatar className="h-10 w-10">
        <AvatarFallback>{review.authorName.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <span className="font-bold text-sm sm:mt-1">{review.authorName}</span>
    </div>
    <div className="flex-grow">
      <div className="flex items-center justify-between mb-2">
        <StarRating rating={review.rating} size="sm" readOnly />
        <p className="text-xs text-muted-foreground flex-shrink-0">
          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: faIR })}
        </p>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
    </div>
  </div>
);

// Review Form Component
const ReviewForm = ({ providerId, onReviewSubmit }: { providerId: number, onReviewSubmit: () => void }) => {
  const { user, isLoggedIn, addReview } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoggedIn || user?.accountType !== 'customer') {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) {
      toast({ title: "خطا", description: "لطفاً امتیاز و متن نظر را وارد کنید.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    setTimeout(() => {
        if (!user) return;
        
        const newReview: Review = {
          id: Date.now().toString(),
          providerId,
          authorName: user.name,
          rating,
          comment,
          createdAt: new Date().toISOString(),
        };
        
        addReview(newReview);
        
        toast({ title: "موفق", description: "نظر شما با موفقیت ثبت شد." });
        setRating(0);
        setComment('');
        setIsSubmitting(false);
        onReviewSubmit(); 
    }, 1000);
  };
  
  const isButtonDisabled = isSubmitting || rating === 0 || !comment.trim();

  return (
    <Card className="mt-8 bg-muted/30">
      <CardHeader>
        <CardTitle className="font-headline text-xl">نظر خود را ثبت کنید</CardTitle>
        <CardDescription>تجربه خود را با دیگران به اشتراک بگذارید.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-sm mb-2 block">امتیاز شما:</label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
          <div>
            <label htmlFor="comment" className="font-semibold text-sm mb-2 block">نظر شما:</label>
            <Textarea
              id="comment"
              placeholder="تجربه خود را اینجا بنویسید..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isButtonDisabled} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
                ارسال نظر
            </Button>
             {isButtonDisabled && !isSubmitting && (
                <p className="text-xs text-center text-muted-foreground">
                    {rating === 0 && !comment.trim() ? "لطفاً برای ثبت نظر، امتیاز و متن نظر را وارد کنید." :
                     rating === 0 ? "لطفاً امتیاز خود را با انتخاب ستاره‌ها مشخص کنید." :
                     "لطفاً متن نظر خود را بنویسید."}
                </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const { user, providers, reviews, isLoading, updateProviderData, addAgreement } = useAuth();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerReviews, setProviderReviews] = useState<Review[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setIsDataLoading(true);
    // Ensure providers and reviews are loaded before proceeding
    if (!providers || !reviews) {
      setIsDataLoading(false);
      return;
    }
    
    const numericProviderId = parseInt(providerId, 10);
    
    if (isNaN(numericProviderId)) {
        setIsDataLoading(false);
        setProvider(null);
        return;
    }
    
    const foundProvider = providers.find(p => p.id === numericProviderId);
    
    if (foundProvider) {
      setProvider(foundProvider);
      const foundReviews = reviews.filter(r => r.providerId === foundProvider.id)
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProviderReviews(foundReviews);
    } else {
      setProvider(null);
    }
    
    setIsDataLoading(false);
  }, [providerId, providers, reviews]);

  useEffect(() => {
    if (!isLoading) {
      loadData();
    }
  }, [isLoading, loadData]);
  
  const isOwnerViewing = user && user.phone === provider?.phone;

  const deletePortfolioItem = (itemIndex: number) => {
    if (!provider) return;
    const success = updateProviderData(provider.phone, (p) => {
      p.portfolio = p.portfolio.filter((_, index) => index !== itemIndex);
    });
    if (success) {
      toast({ title: 'موفق', description: 'نمونه کار حذف شد.' });
    } else {
      toast({ title: 'خطا', description: 'هنرمند یافت نشد.', variant: 'destructive' });
    }
  };
  
  const handleAgreementRequest = () => {
    if (!provider) return;
    addAgreement(provider);
    toast({
      title: "درخواست ارسال شد",
      description: "درخواست توافق برای هنرمند ارسال شد. می‌توانید وضعیت آن را در صفحه درخواست‌ها پیگیری کنید.",
    });
  }


  if (isLoading || isDataLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20 flex justify-center">
        <div className="max-w-2xl w-full">
            <Card className="flex flex-col w-full overflow-hidden h-full">
                <div className="p-6 flex flex-col items-center text-center bg-muted/30">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
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
                        <User className="w-12 h-12 text-muted-foreground" />
                        </div>
                    )}
                    </div>
                    <CardTitle className="font-headline text-2xl">{provider.name}</CardTitle>
                    <CardDescription className="text-base">{provider.service}</CardDescription>
                    <div className="mt-2">
                        <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} readOnly />
                    </div>
                </div>

                <CardContent className="p-6 flex-grow flex flex-col">
                    <p className="text-base text-foreground/80 leading-relaxed mb-6 text-center">{provider.bio}</p>
                    <Separator className="my-4" />
                    <h3 className="font-headline text-xl mb-4 text-center">نمونه کارها</h3>
                    {provider.portfolio && provider.portfolio.length > 0 ? (
                        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {provider.portfolio.map((item, index) => (
                                    <DialogTrigger asChild key={`${provider.id}-portfolio-${index}`}>
                                        <div 
                                            className="group relative w-full aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                                            onClick={() => setSelectedImage(item.src)}
                                        >
                                            <Image
                                                src={item.src}
                                                alt={`نمونه کار ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={item.aiHint}
                                            />
                                            {isOwnerViewing && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        aria-label={`حذف نمونه کار ${index + 1}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>تایید حذف</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        آیا از حذف این نمونه کار مطمئنید؟
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>لغو</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deletePortfolioItem(index)}>حذف</AlertDialogAction>
                                                </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
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
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>هنوز نمونه کاری اضافه نشده است.</p>
                        </div>
                    )}
                </CardContent>

                {!isOwnerViewing && (
                <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 mt-auto border-t">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full">
                                <Handshake className="w-4 h-4 ml-2" />
                                ارسال درخواست توافق
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>تایید ارسال درخواست</AlertDialogTitle>
                            <AlertDialogDescription>
                                با این کار شما یک درخواست توافق اولیه برای این هنرمند ارسال می‌کنید. این به معنای رزرو قطعی نیست. آیا مایل به ادامه هستید؟
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>لغو</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAgreementRequest}>ارسال درخواست</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button asChild className="w-full" variant="secondary">
                        <Link href={`/chat/${provider.phone}`}>
                            <MessageSquare className="w-4 h-4 ml-2" />
                            ارسال پیام
                        </Link>
                    </Button>
                </CardFooter>
                )}

                <Separator />
                
                <div id="reviews" className="p-6 scroll-mt-20">
                    <h3 className="font-headline text-xl mb-4 text-center">نظرات مشتریان</h3>
                    {providerReviews.length > 0 ? (
                        <div className="space-y-4">
                            {providerReviews.map(review => <ReviewCard key={review.id} review={review} />)}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>هنوز نظری برای این هنرمند ثبت نشده است. اولین نفر باشید!</p>
                        </div>
                    )}
                    <ReviewForm providerId={provider.id} onReviewSubmit={loadData} />
                </div>
            </Card>
        </div>
    </div>
  );
}
