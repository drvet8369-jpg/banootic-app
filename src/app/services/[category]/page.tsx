
import { categories, services } from '@/lib/constants';
import { getProviders } from '@/lib/data';
import type { Category, Service, Provider } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SearchResultCard from '@/components/search-result-card';


interface PageProps {
  params: {
    category: string;
  };
}

export async function generateStaticParams() {
  return categories.map((category) => ({
    category: category.slug,
  }));
}


export default async function CategoryPage({ params }: PageProps) {
  const category = categories.find((c) => c.slug === params.category);
  const categoryServices = services.filter((s) => s.category_id === category?.id);

  if (!category) {
    notFound();
  }

  // Fetch providers for the entire category
  const categoryProviders = await getProviders({ categorySlug: params.category });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{category.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
      </div>

      {/* Section for Sub-services */}
      {categoryServices.length > 0 && (
        <div className="mb-16">
            <h2 className="text-2xl font-headline font-bold text-center mb-8">خدمات تخصصی</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryServices.map((service) => (
                <Link href={`/services/${category.slug}/${service.slug}`} key={service.slug}>
                <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                    <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="font-headline text-xl">{service.name}</CardTitle>
                    <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                    </CardHeader>
                </Card>
                </Link>
            ))}
            </div>
        </div>
      )}
      
      <div className="border-t pt-16">
         <h2 className="text-2xl font-headline font-bold text-center mb-8">تمام هنرمندان این دسته</h2>
          {categoryProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryProviders.map((provider) => (
                <SearchResultCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">هنوز هیچ هنرمندی در این دسته‌بندی ثبت‌نام نکرده است.</p>
              <Link href="/login" className="mt-2 inline-block text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
                اولین نفر باشید!
              </Link>
            </div>
          )}
      </div>

    </div>
  );
}
