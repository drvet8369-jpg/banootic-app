import { services, providers, categories } from '@/lib/data';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    category: string;
    service: string;
  };
}

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
        <p className="mt-3 text-lg text-muted-foreground">
          ارائه‌دهندگان خدمات برای <span className="font-semibold">{service.name}</span> در دسته‌ی <Link href={`/services/${category.slug}`} className="text-primary hover:underline">{category.name}</Link>
        </p>
      </div>

      {serviceProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceProviders.map((provider) => (
            <Card key={provider.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{provider.name}</CardTitle>
                <CardDescription>{provider.service}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">{provider.bio}</p>
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 ml-2 text-accent" />
                  <span>{provider.location}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <a href={`tel:${provider.phone}`}>
                    <Phone className="w-4 h-4 ml-2" />
                    تماس با ارائه‌دهنده
                  </a>
                </Button>
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
