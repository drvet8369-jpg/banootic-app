'use client'

import { categories, services } from '@/lib/storage';
import type { Category, Service } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: {
    category: string;
  };
}

const getCategoryData = (slug: string): { category: Category | undefined, categoryServices: Service[] } => {
  const category = categories.find((c) => c.slug === slug);
  const categoryServices = services.filter((s) => s.categorySlug === slug);
  return { category, categoryServices };
};

export default function CategoryPage({ params }: PageProps) {
  const { category, categoryServices } = getCategoryData(params.category);

  if (!category) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{category.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
      </div>

      {categoryServices.length > 0 ? (
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
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ خدماتی در این دسته‌بندی ثبت نشده است.</p>
           <Button asChild variant="link" className="mt-2">
            <Link href="/register">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
