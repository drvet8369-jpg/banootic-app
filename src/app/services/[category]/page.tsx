import { categories, services } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getProviders } from '@/lib/data';
import SearchResultCard from '@/components/search-result-card';
import { Separator } from '@/components/ui/separator';

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

const getCategoryData = async (slug: string) => {
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { category: undefined, categoryServices: [], providers: [] };
  }
  const categoryServices = services.filter((s) => s.category_id === category.id);
  const providers = await getProviders({ categorySlug: slug });
  return { category, categoryServices, providers };
};


export default async function CategoryPage({ params }: PageProps) {
  const { category, categoryServices, providers } = await getCategoryData(params.category);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">{category.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
      </div>

      {categoryServices.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-headline font-bold text-center mb-8">زیرشاخه‌های تخصصی</h2>
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

      <Separator className="my-12" />

      <div className='mt-16'>
        <h2 className="text-2xl font-headline font-bold text-center mb-12">هنرمندان این دسته</h2>
        {providers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider) => (
                <SearchResultCard key={provider.id} provider={provider} />
            ))}
            </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">هنوز هیچ هنرمندی در این دسته‌بندی ثبت‌نام نکرده است.</p>
            <Link href="/login" className="mt-2 inline-block text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                اولین نفر باشید!
            </Link>
            </div>
        )}
      </div>
    </div>
  );
}
