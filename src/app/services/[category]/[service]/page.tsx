
import { services, providers, categories } from '@/lib/data';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PageProps {
  params: {
    category: string;
    service: string;
  };
}

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


export async function generateStaticParams() {
  return services.map((service) => ({
    category: service.categorySlug,
    service: service.slug,
  }));
}

const getServiceData = (categorySlug: string, serviceSlug: string): { service: Service | undefined, serviceProviders: Provider[], category: Category | undefined } => {
  const category = categories.find((c) => c.slug === categorySlug);
  const service = services.find((s) => s.slug === serviceSlug && s.categorySlug === categorySlug);
  const serviceProviders = providers.filter((p) => p.serviceSlug === serviceSlug);
  return { service, serviceProviders, category };
};

export default function ServiceProvidersPage({ params }: PageProps) {
  const { service, serviceProviders, category } = getServiceData(params.category, params.service);

  if (!service || !category) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{service.name}</h1>
        <p className="mt-3 text-lg text-foreground font-semibold">
          ارائه‌دهندگان خدمات برای {service.name} در دسته‌ی{' '}
          <Link href={`/services/${category.slug}`} className="hover:underline">
            {category.name}
          </Link>
        </p>
      </div>

      {serviceProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceProviders.map((provider) => (
            <Card key={provider.id} className="flex flex-col group">
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
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button className="w-full" disabled>
                                <MessageSquare className="w-4 h-4 ml-2" />
                                ارسال پیام
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>این ویژگی به زودی فعال خواهد شد.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ ارائه‌دهنده‌ای برای این سرویس ثبت‌نام نکرده است.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/register">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
