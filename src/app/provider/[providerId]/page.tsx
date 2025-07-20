
import { providers } from '@/lib/data';
import type { Provider } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

interface PageProps {
  params: {
    providerId: string;
  };
}

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


export async function generateStaticParams() {
  return providers.map((provider) => ({
    providerId: provider.id.toString(),
  }));
}

const getProviderData = (providerId: string): Provider | undefined => {
  return providers.find(p => p.id.toString() === providerId);
};

export default function ProviderDetailsPage({ params }: PageProps) {
  const provider = getProviderData(params.providerId);

  if (!provider) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20">
      <Card>
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 p-6 flex flex-col items-center text-center">
            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
               {provider.portfolio && provider.portfolio.length > 0 ? (
                <Image
                  src={provider.portfolio[0].src}
                  alt={provider.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={provider.portfolio[0].aiHint}
                />
              ) : (
                 <div className="bg-muted w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground">{provider.name.charAt(0)}</span>
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
          <div className="md:col-span-2 p-6 md:border-r border-t md:border-t-0">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">درباره هنرمند</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-foreground/80 leading-relaxed">{provider.bio}</p>
               <Separator className="my-6" />
                <h3 className="font-headline text-xl mb-4">نمونه کارها</h3>
                 {provider.portfolio && provider.portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {provider.portfolio.map((item, index) => (
                            <div key={index} className="overflow-hidden rounded-lg shadow-md aspect-w-1 aspect-h-1">
                                <Image 
                                    src={item.src}
                                    alt={`نمونه کار ${index + 1}`}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                    data-ai-hint={item.aiHint}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">هنوز نمونه کاری اضافه نشده است.</p>
                )}
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button asChild className="w-full">
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
    </div>
  );
}
