'use client';

import { useSearchParams } from 'next/navigation';
import { getAgreements, calculateProviderScore } from '@/lib/data';
import { getAllProviders } from '@/lib/api'; // Import from the new api file
import type { Provider } from '@/lib/types';
import SearchResultCard from '@/components/search-result-card';
import { SearchX, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    try {
        const allProviders = await getAllProviders(); // Use the async API call
        const allAgreements = getAgreements(); // This still comes from localStorage for now

        const getScore = (provider: Provider) => {
            const confirmedCount = allAgreements.filter(a => a.providerPhone === provider.phone && a.status === 'confirmed').length;
            return calculateProviderScore(provider, confirmedCount);
        };

        let results: Provider[];

        if (!query) {
            results = [...allProviders].sort((a, b) => getScore(b) - getScore(a));
        } else {
            const lowercasedQuery = query.toLowerCase();
            results = allProviders
                .filter(provider => 
                    provider.name.toLowerCase().includes(lowercasedQuery) ||
                    provider.service.toLowerCase().includes(lowercasedQuery) ||
                    (provider.bio && provider.bio.toLowerCase().includes(lowercasedQuery))
                )
                .sort((a,b) => getScore(b) - getScore(a));
        }
        setSearchResults(results);
    } catch (error) {
        console.error("Failed to fetch providers for search:", error);
        // Optionally, show a toast or error message to the user
    } finally {
        setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);


  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">
            {query ? 'نتایج جستجو' : 'برترین هنرمندان'}
        </h1>
        {query ? (
          <p className="mt-3 text-lg text-muted-foreground">
            برای عبارت: <span className="font-bold text-foreground">"{query}"</span>
          </p>
        ) : (
          <p className="mt-3 text-lg text-muted-foreground">
            لیست هنرمندان بر اساس امتیاز و فعالیت در پلتفرم مرتب شده است.
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
