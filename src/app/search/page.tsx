'use client';

import { useSearchParams } from 'next/navigation';
// Use the new api.ts file to fetch data from Supabase
import { getAllProviders } from '@/lib/api'; 
import { getAgreements, calculateProviderScore } from '@/lib/data';
import type { Provider } from '@/lib/types';
import SearchResultCard from '@/components/search-result-card';
import { SearchX, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const query = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch providers from Supabase instead of localStorage
      const allProviders = await getAllProviders();
      const allAgreements = getAgreements();

      const getScore = (provider: Provider) => {
          const confirmedCount = allAgreements.filter(a => a.providerPhone === provider.phone && a.status === 'confirmed').length;
          return calculateProviderScore(provider, confirmedCount);
      }

      if (!query) {
        // If query is empty, show all providers, sorted by score
        const sortedProviders = allProviders.sort((a, b) => getScore(b) - getScore(a));
        setSearchResults(sortedProviders);
      } else {
        // If there is a query, filter and then sort
        const lowercasedQuery = query.toLowerCase();
        const results = allProviders.filter(provider => 
          provider.name.toLowerCase().includes(lowercasedQuery) ||
          provider.service.toLowerCase().includes(lowercasedQuery) ||
          provider.bio.toLowerCase().includes(lowercasedQuery)
        );
        const sortedResults = results.sort((a, b) => getScore(b) - getScore(a));
        setSearchResults(sortedResults);
      }
    } catch (error) {
        console.error(error);
        toast({
            title: 'خطا در بارگذاری',
            description: 'متاسفانه در ارتباط با پایگاه داده مشکلی پیش آمده است.',
            variant: 'destructive',
        });
        setSearchResults([]); // Clear results on error
    } finally {
        setIsLoading(false);
    }
  }, [query, toast]);

  useEffect(() => {
    performSearch();
    // We can remove the focus listener for now as Supabase provides more real-time capabilities
    // which we can implement later if needed.
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
            نمایش همه هنرمندان بر اساس بالاترین امتیاز.
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
