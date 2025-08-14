'use client';

import { services, categories, getProviders, getAgreements } from '@/lib/data';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import SearchResultCard from '@/components/search-result-card';

export default function ServiceProvidersPage() {
  const params = useParams<{ category: string; service: string }>();
  const { category: categorySlug, service: serviceSlug } = params;

  const [serviceProviders, setServiceProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const category = useMemo(() => categories.find((c) => c.slug === categorySlug), [categorySlug]);
  const service = useMemo(() => services.find((s) => s.slug === serviceSlug && s.categorySlug === categorySlug), [serviceSlug, categorySlug]);

  const loadData = useCallback(() => {
    setIsLoading(true);

    if (category && service) {
      const allProviders = getProviders();
      const allAgreements = getAgreements();

      // Create a map of provider phone to confirmed agreements count
      const agreementsCountMap = new Map<string, number>();
      allAgreements.forEach(agreement => {
          if (agreement.status === 'confirmed') {
              agreementsCountMap.set(agreement.providerPhone, (agreementsCountMap.get(agreement.providerPhone) || 0) + 1);
          }
      });
      
      const filteredProviders = allProviders.filter((p) => p.serviceSlug === serviceSlug);

      // Sort providers based on the ladder system
      const sortedProviders = filteredProviders.sort((a, b) => {
        const agreementsA = agreementsCountMap.get(a.phone) || 0;
        const agreementsB = agreementsCountMap.get(b.phone) || 0;

        // 1. Sort by reviewsCount (descending)
        if (b.reviewsCount !== a.reviewsCount) {
          return b.reviewsCount - a.reviewsCount;
        }
        // 2. Sort by agreementsCount (descending)
        if (agreementsB !== agreementsA) {
          return agreementsB - agreementsA;
        }
        // 3. Sort by rating (descending)
        return b.rating - a.rating;
      });

      setServiceProviders(sortedProviders);
    } else {
      setServiceProviders([]);
    }
    
    setIsLoading(false);
  }, [category, service, serviceSlug]);

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
