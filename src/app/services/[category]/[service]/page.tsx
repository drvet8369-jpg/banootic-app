'use client';

import { getServiceBySlug, getProvidersByService } from '@/lib/data';
import type { Service, Profile, Category } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SearchResultCard from '@/components/search-result-card';
import { Skeleton } from '@/components/ui/skeleton';

function ProviderCardSkeleton() {
  return (
    <div className="border rounded-lg flex flex-col items-center p-6">
      <Skeleton className="h-24 w-24 rounded-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-5 w-1/2 mb-4" />
      <Skeleton className="h-5 w-2/3" />
      <div className="w-full p-4 mt-auto border-t">
         <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export default function ServiceProvidersPage() {
  const params = useParams<{ category: string; service: string }>();
  const { category: categorySlug, service: serviceSlug } = params;

  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(false);
      
      const foundService = await getServiceBySlug(categorySlug, serviceSlug);
      if (!foundService) {
        setError(true);
        setIsLoading(false);
        return;
      }
      
      const foundProviders = await getProvidersByService(serviceSlug);

      setService(foundService);
      setProviders(foundProviders);
      setIsLoading(false);
    }
    loadData();
  }, [categorySlug, serviceSlug]);

  if (isLoading) {
    return (
        <div className="py-12 md:py-20">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-1/3 mx-auto mb-4" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({length: 3}).map((_,i) => <ProviderCardSkeleton key={i} />)}
          </div>
        </div>
    );
  }
  
  if (error || !service) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{service.name}</h1>
        <p className="mt-3 text-lg text-foreground font-semibold">
          ارائه‌دهندگان خدمات برای {service.name} در دسته‌ی{' '}
          <Link href={`/services/${categorySlug}`} className="hover:underline">
            {
                // We don't have the category name here without another query,
                // so we can just show the slug or fetch it if needed.
                categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
            }
          </Link>
        </p>
      </div>

      {providers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {providers.map((provider) => (
            <SearchResultCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ ارائه‌دهنده‌ای برای این سرویس ثبت‌نام نکرده است.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/login">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
