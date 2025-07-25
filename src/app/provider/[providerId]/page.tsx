
'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getProviders, getReviews, saveProviders, saveReviews } from '@/lib/data';
import type { Provider, Review } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import { Loader2, MessageSquare, Phone, User, Send, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import Image from 'next/image';
import Link from 'next/link';

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
const ReviewForm = ({ providerId, onSubmit }: { providerId: number, onSubmit: () => void }) => {
  const { user, isLoggedIn } = useAuth();
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

    // Simulate API call
    setTimeout(() => {
        const allReviews = getReviews();
        const newReview: Review = {
        id: Date.now().toString(),
        providerId,
        authorName: user.name,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        };

        const updatedReviews = [...allReviews, newReview];
        saveReviews(updatedReviews);

        // Recalculate provider's average rating
        const allProviders = getProviders();
        const providerIndex = allProviders.findIndex(p => p.id === providerId);
        if (providerIndex > -1) {
            const providerReviews = updatedReviews.filter(r => r.providerId === providerId);
            const totalRating = providerReviews.reduce((acc, r) => acc + r.rating, 0);
            const newAverageRating = parseFloat((totalRating / providerReviews.length).toFixed(1));
            
            allProviders[providerIndex].rating = newAverageRating;
            allProviders[providerIndex].reviewsCount = providerReviews.length;
            saveProviders(allProviders);
        }

        toast({ title: "موفق", description: "نظر شما با موفقیت ثبت شد." });
        setRating(0);
        setComment('');
        setIsSubmitting(false);
        onSubmit(); // Callback to trigger data refresh in parent
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
  const providerPhone = params.providerId as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    // No need to set loading true on every focus, just initial load
    const allProviders = getProviders();
    const foundProvider = allProviders.find(p => p.phone === providerPhone);
    
    if (foundProvider) {
      setProvider(foundProvider);
      const allReviews = getReviews();
      const providerReviews = allReviews.filter(r => r.providerId === foundProvider.id)
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(providerReviews);
    } else {
      setProvider(null); // Explicitly set to null if not found
    }
    
    setIsLoading(false);
  }, [providerPhone]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
    window.addEventListener('focus', loadData); // Refreshes data when tab is refocused
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
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
                    <div className="flex overflow-x-auto gap-4 pb-4">
                        {provider.portfolio.map((item, index) => (
                            <div key={`${provider.id}-portfolio-${index}`} className="group relative flex-shrink-0 w-40 h-40 overflow-hidden rounded-lg shadow-md">
                            <Image
                                src={item.src}
                                alt={`نمونه کار ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={item.aiHint}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <p>هنوز نمونه کاری اضافه نشده است.</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 mt-auto border-t">
                <Button asChild className="w-full">
                    <Link href={`/chat/${provider.phone}`}>
                        <MessageSquare className="w-4 h-4 ml-2" />
                        ارسال پیام
                    </Link>
                </Button>
                <Button asChild className="w-full" variant="secondary">
                    <a href={`tel:${provider.phone}`}>
                        <Phone className="w-4 h-4 ml-2" />
                        تماس
                    </a>
                </Button>
            </CardFooter>

            <Separator />
            
            <div className="p-6">
                <h3 className="font-headline text-xl mb-4 text-center">نظرات مشتریان</h3>
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <p>هنوز نظری برای این هنرمند ثبت نشده است. اولین نفر باشید!</p>
                    </div>
                )}
                 <ReviewForm providerId={provider.id} onSubmit={loadData} />
            </div>
          </Card>
      </div>
    </div>
  );
}

