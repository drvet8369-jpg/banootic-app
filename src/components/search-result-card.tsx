
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Eye } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { StarRating } from '@/components/ui/star-rating';

interface SearchResultCardProps {
  provider: Profile;
}

export default function SearchResultCard({ provider }: SearchResultCardProps) {
  return (
      <Card className="flex flex-col w-full overflow-hidden h-full">
        <CardHeader className="flex-col items-center text-center p-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
            {provider.profile_image_url ? (
              <Image
                src={provider.profile_image_url}
                alt={provider.full_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="bg-muted w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="font-headline text-xl">{provider.full_name}</CardTitle>
          <CardDescription className="text-base">{provider.service_description || provider.service_name}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-4 pt-0">
          <StarRating rating={provider.rating || 0} reviewsCount={provider.reviews_count} readOnly />
        </CardContent>
         <CardFooter className="p-4 mt-auto border-t">
           <Button asChild className="w-full font-bold">
            <Link href={`/provider/${provider.id}`}>
                <Eye className="w-4 h-4 ml-2" />
                مشاهده پروفایل
            </Link>
           </Button>
        </CardFooter>
      </Card>
  );
}
