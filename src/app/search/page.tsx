'use client';

import { useSearchParams } from 'next/navigation';
import { getProviders } from '@/lib/storage';
import type { Provider } from '@/lib/types';
import SearchResultCard from '@/components/search-result-card';
import { SearchX, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const performSearch = useCallback(() => {
    setIsLoading(true);
    
    const allProviders = getProviders();
    if (!query) {
      const sortedProviders = allProviders.sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
      setSearchResults(sortedProviders);
      setIsLoading(false);
      return;
    }
    const lowercasedQuery = query.toLowerCase();
    const results = allProviders.filter(provider => 
      provider.name.toLowerCase().includes(lowercasedQuery) ||
      provider.service.toLowerCase().includes(lowercasedQuery) ||
      provider.bio.toLowerCase().includes(lowercasedQuery)
    );

    const sortedResults = results.sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
    
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
        <h1 className="font-headline text-4xl md:text-5xl font-bold">نتایج جستجو</h1>
        {query ? (
          <p className="mt-3 text-lg text-muted-foreground">
            برای عبارت: <span className="font-bold text-foreground">"{query}"</span>
          </p>
        ) : (
          <p className="mt-3 text-lg text-muted-foreground">
            نمایش همه هنرمندان بر اساس محبوبیت
          </p>
        )}
      </div>

      {isLoading ? (
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
