
'use client';

import { services, categories } from '@/lib/constants';
import { getAllProviders } from '@/lib/api';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import SearchResultCard from '@/components/search-result-card';

export default function ServiceProvidersPage() {
  const params = useParams<{ category: string; service: string }>();
  const { category: categorySlug, service: serviceSlug } = params;

  const [service, setService] = useState<Service | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [serviceProviders, setServiceProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Find category and service info from static constants
    const foundCategory = categories.find((c) => c.slug === categorySlug);
    const foundService = services.find((s) => s.slug === serviceSlug && s.categorySlug === categorySlug);

    setCategory(foundCategory || null);
    setService(foundService || null);
      
    if (foundCategory && foundService) {
      try {
        const allProviders = await getAllProviders();
        // Correctly filter providers based on ONLY the serviceSlug from the URL.
        const foundProviders = allProviders.filter((p) => p.serviceSlug === serviceSlug);
        setServiceProviders(foundProviders);
      } catch (error) {
        console.error("Failed to fetch providers for service page:", error);
        setServiceProviders([]); // Set to empty on error
      }
    } else {
      setServiceProviders([]);
    }
    
    setIsLoading(false);
  }, [categorySlug, serviceSlug]);

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
  
  if (!service || !category) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20 flex-grow">
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
