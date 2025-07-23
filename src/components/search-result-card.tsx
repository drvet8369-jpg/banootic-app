
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, MessageSquare, User } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

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
      <CardHeader className="flex-row gap-4 items-center">
        <Link href={`/provider/${provider.id}`} className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-sm shrink-0">
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
                <User className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </Link>
        <div className="flex-grow">
          <Link href={`/provider/${provider.id}`}>
            <CardTitle className="font-headline text-2xl group-hover:text-accent transition-colors">{provider.name}</CardTitle>
          </Link>
          <CardDescription className="text-sm">{provider.service}</CardDescription>
           <div className="mt-1">
              <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} />
           </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col gap-4">
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
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg aspect-video flex items-center justify-center">
              <p>نمونه کاری اضافه نشده است.</p>
            </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{provider.bio}</p>
        <div className="flex items-center text-sm text-muted-foreground pt-2 border-t">
          <MapPin className="w-4 h-4 ml-2 text-accent" />
          <span>{provider.location}</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
         <Button asChild className="w-full" variant="outline">
          <a href={`tel:${provider.phone}`}>
            <Phone className="w-4 h-4 ml-2" />
            تماس
          </a>
        </Button>
        <Button asChild className="w-full">
            <Link href={`/chat/${provider.id}`}>
                <MessageSquare className="w-4 h-4 ml-2" />
                ارسال پیام
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
