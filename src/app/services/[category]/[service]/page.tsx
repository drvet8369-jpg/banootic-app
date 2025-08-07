'use client';

import { services, categories } from '@/lib/storage';
import { getProviders } from '@/lib/storage';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import SearchResultCard from '@/components/search-result-card';

// Ranking algorithm function
const calculateRankingScore = (provider: Provider): number => {
    const ratingWeight = 0.20;
    const reviewsWeight = 0.50;
    const agreementsWeight = 0.30;

    // Use logarithmic scale to avoid massive scores for high counts
    // and give new providers a chance. Add 1 to avoid log(0).
    const normalizedReviews = Math.log( (provider.reviewsCount || 0) + 1);
    const normalizedAgreements = Math.log( (provider.agreementsCount || 0) + 1);

    const score = (provider.rating * ratingWeight) 
                + (normalizedReviews * reviewsWeight) 
                + (normalizedAgreements * agreementsWeight);

    return score;
}

export default function ServiceProvidersPage() {
  const params = useParams<{ category: string; service: string }>();
  const { category: categorySlug, service: serviceSlug } = params;

  const [service, setService] = useState<Service | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [serviceProviders, setServiceProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);

    const foundCategory = categories.find((c) => c.slug === categorySlug);
    const foundService = services.find((s) => s.slug === serviceSlug && s.categorySlug === categorySlug);
    
    setCategory(foundCategory || null);
    setService(foundService || null);
      
    if (foundCategory && foundService) {
      const allProviders = getProviders();
      const foundProviders = allProviders.filter((p) => p.serviceSlug === serviceSlug);
      const sortedProviders = foundProviders.sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
      setServiceProviders(sortedProviders);
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
            <SearchResultCard key={provider.phone} provider={provider} />
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
