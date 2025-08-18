'use client';

import { categories, services } from '@/lib/constants';
import type { Category, Provider } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChevronLeft, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import { getAllProviders } from '@/lib/api';
import SearchResultCard from '@/components/search-result-card';


export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const categorySlug = params.category as Category['slug'];

  const [category, setCategory] = useState<Category | null>(null);
  const [categoryProviders, setCategoryProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const foundCategory = categories.find((c) => c.slug === categorySlug);
    setCategory(foundCategory || null);

    if (foundCategory) {
      // Get the list of all service slugs that belong to this category
      const serviceSlugsInCategory = services
        .filter(s => s.categorySlug === foundCategory.slug)
        .map(s => s.slug);
      
      const allProviders = await getAllProviders();
      // Filter providers whose serviceSlug is in the list for this category
      const providersInCategory = allProviders.filter(p => 
        serviceSlugsInCategory.includes(p.serviceSlug)
      );
      setCategoryProviders(providersInCategory);
    } else {
      setCategoryProviders([]);
    }
    setIsLoading(false);
  }, [categorySlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  if (isLoading) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-20 flex-grow">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">در حال یافتن هنرمندان...</p>
        </div>
    );
  }

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
            <SearchResultCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ هنرمندی در این دسته‌بندی ثبت‌نام نکرده است.</p>
           <Button asChild variant="link" className="mt-2">
            <Link href="/register">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
