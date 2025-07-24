
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, MessageSquare, User } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';

const StarRating = ({ rating, reviewsCount }: { rating: number; reviewsCount: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 fill-current" />
        ))}
        {halfStar && <Star key="half" className="w-5 h-5" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" />
        ))}
      </div>
      <span className="text-muted-foreground text-sm">({reviewsCount} نظر)</span>
    </div>
  );
};

interface SearchResultCardProps {
  provider: Provider;
}

export default function SearchResultCard({ provider }: SearchResultCardProps) {
  return (
    <Card className="flex flex-col w-full overflow-hidden h-full">
      {/* Top Section: Avatar & Basic Info */}
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
          <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} />
        </div>
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 ml-2 text-accent" />
          <span>{provider.location}</span>
        </div>
      </div>
      
      <Separator />

      {/* Mid Section: Bio & Portfolio */}
      <CardContent className="p-6 flex-grow flex flex-col">
          <p className="text-base text-foreground/80 leading-relaxed mb-6 text-center">{provider.bio}</p>
          <Separator className="my-4" />
          <h3 className="font-headline text-xl mb-4 text-center">نمونه کارها</h3>
          {provider.portfolio && provider.portfolio.length > 0 ? (
            <div className="w-full px-8 sm:px-10">
              <Carousel 
                className="w-full mx-auto"
                opts={{
                  loop: provider.portfolio.length > 1,
                  align: "start"
                }}
              >
                <CarouselContent className="-ml-4">
                  {provider.portfolio.map((item, index) => (
                    <CarouselItem key={`${provider.id}-portfolio-${index}`} className="pl-4">
                      <div className="p-1">
                        <Card className="overflow-hidden">
                          <CardContent className="flex aspect-video items-center justify-center p-0">
                            <Image
                              src={item.src}
                              alt={`نمونه کار ${index + 1}`}
                              width={600}
                              height={400}
                              className="w-full h-full object-cover"
                              data-ai-hint={item.aiHint}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {provider.portfolio.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
              <p>هنوز نمونه کاری اضافه نشده است.</p>
            </div>
          )}
      </CardContent>

      {/* Footer Section: Actions */}
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
    </Card>
  );
}
