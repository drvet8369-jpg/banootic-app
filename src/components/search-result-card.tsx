
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Eye } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { StarRating } from '@/components/ui/star-rating';

interface SearchResultCardProps {
  provider: Provider;
  debugSlug?: string; // Prop for temporary debugging
}

export default function SearchResultCard({ provider, debugSlug }: SearchResultCardProps) {
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
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-4 pt-0">
          <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} readOnly />
        </CardContent>
         <CardFooter className="p-4 mt-auto border-t flex-col">
           {/* Temporary debugging display */}
           {debugSlug && (
             <div className="w-full p-2 mb-2 text-center bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p className="text-xs font-bold">DEBUG INFO</p>
                <p className="text-sm font-mono break-all">'{debugSlug}'</p>
             </div>
           )}
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
