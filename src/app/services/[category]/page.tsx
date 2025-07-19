import { categories, providers } from '@/lib/data';
import type { Category, Provider } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

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

const getCategoryData = (slug: string): { category: Category | undefined, categoryProviders: Provider[] } => {
  const category = categories.find((c) => c.slug === slug);
  const categoryProviders = providers.filter((p) => p.categorySlug === slug);
  return { category, categoryProviders };
};

export default function CategoryPage({ params }: PageProps) {
  const { category, categoryProviders } = getCategoryData(params.category);

  if (!category) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{category.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
      </div>

      {categoryProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoryProviders.map((provider) => (
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
          <p className="text-muted-foreground">هنوز هیچ ارائه‌دهنده‌ای در این دسته‌بندی ثبت‌نام نکرده است.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/register">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
