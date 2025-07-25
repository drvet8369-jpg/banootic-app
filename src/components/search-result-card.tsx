
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { StarRating } from '@/components/ui/star-rating';

interface SearchResultCardProps {
  provider: Provider;
}

export default function SearchResultCard({ provider }: SearchResultCardProps) {
  return (
    <Link href={`/provider/${provider.phone}`}>
      <Card className="flex flex-col w-full overflow-hidden h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
        <CardHeader className="flex-col items-center text-center p-6">
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
          <CardTitle className="font-headline text-xl">{provider.name}</CardTitle>
          <CardDescription className="text-base">{provider.service}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-4 pt-0">
          <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} readOnly />
        </CardContent>
      </Card>
    </Link>
  );
}
