import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Eye, Handshake, MapPin } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { StarRating } from '@/components/ui/star-rating';

interface SearchResultCardProps {
  provider: Provider;
}

export default function SearchResultCard({ provider }: SearchResultCardProps) {
  return (
      <Card className="flex flex-col w-full overflow-hidden h-full">
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
           <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <MapPin className="w-4 h-4" />
              <span>{provider.location}</span>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-4 pt-0">
           <div className="flex flex-col items-center gap-2">
            <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} readOnly />
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Handshake className="w-4 h-4" />
                <span>{provider.agreementsCount || 0} توافق موفق</span>
            </div>
           </div>
        </CardContent>
         <CardFooter className="p-4 mt-auto border-t">
           <Button asChild className="w-full font-bold">
            <Link href={`/provider/${provider.phone}`}>
                <Eye className="w-4 h-4 ml-2" />
                مشاهده پروفایل
            </Link>
           </Button>
        </CardFooter>
      </Card>
  );
}
