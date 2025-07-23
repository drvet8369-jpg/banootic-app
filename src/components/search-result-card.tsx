
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, MessageSquare } from 'lucide-react';
import type { Provider } from '@/lib/types';

const StarRating = ({ rating, reviewsCount }: { rating: number; reviewsCount: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        ))}
        {halfStar && <Star key="half" className="w-5 h-5 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
      <span>({reviewsCount} نظر)</span>
    </div>
  );
};

interface SearchResultCardProps {
  provider: Provider;
}

export default function SearchResultCard({ provider }: SearchResultCardProps) {
  return (
    <Card className="flex flex-col group">
      <Link href={`/provider/${provider.id}`} className="flex flex-col flex-grow">
        {provider.portfolio && provider.portfolio.length > 0 && (
          <div className="overflow-hidden rounded-t-lg">
            <Image
              src={provider.portfolio[0].src}
              alt={`${provider.name} نمونه کار`}
              width={400}
              height={250}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={provider.portfolio[0].aiHint}
            />
          </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl group-hover:text-accent transition-colors">{provider.name}</CardTitle>
              <CardDescription>{provider.service}</CardDescription>
            </div>
            <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} />
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{provider.bio}</p>
          <div className="flex items-center text-sm">
            <MapPin className="w-4 h-4 ml-2 text-accent" />
            <span>{provider.location}</span>
          </div>
        </CardContent>
      </Link>
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
