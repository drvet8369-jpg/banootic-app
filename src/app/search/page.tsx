'use client';

import { useSearchParams } from 'next/navigation';
import { getAgreements, getProviders } from '@/lib/data';
import type { Provider } from '@/lib/types';
import SearchResultCard from '@/components/search-result-card';
import { SearchX, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Provider[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const performSearch = useCallback(() => {
    setIsLoading(true);
    const allProviders = getProviders();
    const allAgreements = getAgreements();
    
    // Create a map of provider phone to confirmed agreements count
    const agreementsCountMap = new Map<string, number>();
    allAgreements.forEach(agreement => {
        if (agreement.status === 'confirmed') {
            agreementsCountMap.set(agreement.providerPhone, (agreementsCountMap.get(agreement.providerPhone) || 0) + 1);
        }
    });

    const lowercasedQuery = query.toLowerCase();
    
    // Filter results if there's a query, otherwise use all providers
    const filteredResults = query 
      ? allProviders.filter(provider => 
          provider.name.toLowerCase().includes(lowercasedQuery) ||
          provider.service.toLowerCase().includes(lowercasedQuery) ||
          provider.bio.toLowerCase().includes(lowercasedQuery)
        )
      : allProviders;

    // Sort results based on the ladder system
    const sortedResults = filteredResults.sort((a, b) => {
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

    setSearchResults(sortedResults);
    setIsLoading(false);
  }, [query]);

  useEffect(() => {
    performSearch();

    window.addEventListener('focus', performSearch);
    return () => {
      window.removeEventListener('focus', performSearch);
    };
  }, [performSearch]);


  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">
          {query ? 'نتایج جستجو' : 'هنرمندان برتر'}
        </h1>
        {query ? (
          <p className="mt-3 text-lg text-muted-foreground">
            برای عبارت: <span className="font-bold text-foreground">"{query}"</span>
          </p>
        ) : (
           <p className="mt-3 text-lg text-muted-foreground">
            لیست هنرمندان برتر بر اساس فعالیت و امتیاز.
          </p>
        )}
      </div>

      {isLoading || searchResults === undefined ? (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">در حال جستجو...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {searchResults.map((provider) => (
            <SearchResultCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        query && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <SearchX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-xl">نتیجه‌ای یافت نشد</h3>
            <p className="text-muted-foreground mt-2">
              هیچ ارائه‌دهنده‌ای با عبارت جستجوی شما مطابقت نداشت. لطفا عبارت دیگری را امتحان کنید.
            </p>
          </div>
        )
      )}
    </div>
  );
}
