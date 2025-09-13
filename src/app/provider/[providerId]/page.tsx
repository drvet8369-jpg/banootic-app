import { getProviderByPhone, getReviewsForProvider } from '@/lib/data';
import type { Review } from '@/lib/types';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { createClient } from '@/lib/supabase/server';

import { MessageSquare, Phone, User, Star, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/dialog";

import { ReviewForm } from './review-form';
import { PortfolioGallery } from './portfolio-gallery';
import { unstable_noStore as noStore } from 'next/cache';

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


export default async function ProviderProfilePage({ params }: { params: { providerId: string }}) {
  noStore();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const providerPhone = params.providerId as string;
  const provider = await getProviderByPhone(providerPhone);

  if (!provider) {
    notFound();
  }

  const reviews = await getReviewsForProvider(provider.id);
  const isOwnerViewing = user && user.phone === provider?.phone;

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
                        data-ai-hint={provider.profileImage.aiHint || 'profile photo'}
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
                     <PortfolioGallery provider={provider} isOwner={isOwnerViewing} />
                </CardContent>

                {!isOwnerViewing && (
                <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 mt-auto border-t">
                    <Button asChild className="w-full">
                        <Link href={user ? `/chat/${provider.phone}`: '/login'}>
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
                )}

                <Separator />
                
                <div id="reviews" className="p-6 scroll-mt-20">
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
                    <ReviewForm providerId={provider.id} user={user} />
                </div>
            </Card>
        </div>
    </div>
  );
}
