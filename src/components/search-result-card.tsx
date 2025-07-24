
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
  // This component is now a single, unified card.
  // The erroneous internal grid has been removed and replaced with a clean flexbox layout.
  return (
    <Card className="flex flex-col w-full overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Right Column (Avatar & Basic Info) */}
        <div className="w-full md:w-1/3 p-6 flex flex-col items-center text-center bg-muted/50 md:border-l">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
            {provider.portfolio && provider.portfolio.length > 0 ? (
              <Image
                src={provider.portfolio[0].src}
                alt={provider.name}
                fill
                className="object-cover"
                data-ai-hint={provider.portfolio[0].aiHint}
              />
            ) : (
              <div className="bg-muted w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-muted-foreground" />
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

        {/* Left Column (Details & Portfolio) */}
        <div className="w-full md:w-2/3 p-6 flex flex-col">
          <div className="flex-grow">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-headline text-2xl">درباره هنرمند</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-base text-foreground/80 leading-relaxed mb-6">{provider.bio}</p>
              <Separator className="my-4" />
              <h3 className="font-headline text-xl mb-4 text-center">نمونه کارها</h3>
              {provider.portfolio && provider.portfolio.length > 0 ? (
                <Carousel className="w-full max-w-xs sm:max-w-sm mx-auto">
                  <CarouselContent>
                    {provider.portfolio.map((item, index) => (
                      <CarouselItem key={index}>
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
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                  <p>هنوز نمونه کاری اضافه نشده است.</p>
                </div>
              )}
            </CardContent>
          </div>
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 p-0 mt-auto">
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/chat/${provider.phone}`}>
                <MessageSquare className="w-4 h-4 ml-2" />
                ارسال پیام
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <a href={`tel:${provider.phone}`}>
                <Phone className="w-4 h-4 ml-2" />
                تماس
              </a>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
