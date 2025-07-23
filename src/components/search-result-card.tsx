
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
    <Card className="flex flex-col group w-full">
      <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 p-6 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
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
            <CardTitle className="font-headline text-3xl">{provider.name}</CardTitle>
            <CardDescription className="text-lg">{provider.service}</CardDescription>
            <div className="mt-2">
                <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} />
            </div>
             <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 ml-2 text-accent" />
                <span>{provider.location}</span>
             </div>
          </div>
          <div className="md:col-span-2 p-6 md:border-r border-t md:border-t-0 flex flex-col">
            <div className="flex-grow">
              <CardHeader>
                  <CardTitle className="font-headline text-2xl">درباره هنرمند</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-foreground/80 leading-relaxed">{provider.bio}</p>
                 <Separator className="my-6" />
                  <h3 className="font-headline text-xl mb-4 text-center">نمونه کارها</h3>
                   {provider.portfolio && provider.portfolio.length > 0 ? (
                      <Carousel className="w-full max-w-sm mx-auto">
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
             <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button asChild className="w-full" variant="secondary">
                      <Link href={`/chat/${provider.id}`}>
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
