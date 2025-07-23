
'use client';

import { services, categories, getProviders } from '@/lib/data';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SearchResultCard from '@/components/search-result-card';

export default function ServiceProvidersPage() {
  const params = useParams<{ category: string; service: string }>();
  const { category: categorySlug, service: serviceSlug } = params;

  const [service, setService] = useState<Service | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [serviceProviders, setServiceProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch data on client-side to ensure localStorage is available and fresh
    if (categorySlug && serviceSlug) {
      setIsLoading(true);
      const allProviders = getProviders();
      const foundCategory = categories.find((c) => c.slug === categorySlug) || null;
      const foundService = services.find((s) => s.slug === serviceSlug && s.categorySlug === categorySlug) || null;
      const foundProviders = allProviders.filter((p) => p.serviceSlug === serviceSlug);
      
      setCategory(foundCategory);
      setService(foundService);
      setServiceProviders(foundProviders);
      setIsLoading(false);
    }
  }, [categorySlug, serviceSlug]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">در حال یافتن هنرمندان...</p>
        </div>
    );
  }
  
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
            <SearchResultCard key={provider.id} provider={provider} />
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
