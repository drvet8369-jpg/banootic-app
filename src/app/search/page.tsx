'use client';

import { useSearchParams } from 'next/navigation';
import { getAllProviders, getAgreementsByProvider } from '@/lib/api';
import { calculateProviderScore } from '@/lib/ranking';
import type { Provider } from '@/lib/types';
import { categories } from '@/lib/constants';
import SearchResultCard from '@/components/search-result-card';
import { SearchX, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

// Extend the Provider type to include the score for sorting purposes
type ProviderWithScore = Provider & { score: number };

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category');

  const [searchResults, setSearchResults] = useState<ProviderWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('برترین هنرمندان');

  const performSearchAndRank = useCallback(async () => {
    setIsLoading(true);
    try {
        const allProviders = await getAllProviders();
        
        // Fetch confirmed agreement counts for all providers and calculate scores
        const providersWithScores = await Promise.all(
            allProviders.map(async (provider) => {
                const agreements = await getAgreementsByProvider(provider.phone);
                const confirmedCount = agreements.filter(a => a.status === 'confirmed').length;
                const score = calculateProviderScore(provider, confirmedCount);
                return { ...provider, score };
            })
        );
        
        let filteredResults = providersWithScores;

        // 1. Filter by category if a category slug is present
        if (categorySlug) {
            filteredResults = filteredResults.filter(provider => provider.categorySlug === categorySlug);
            const category = categories.find(c => c.slug === categorySlug);
            setPageTitle(category ? `هنرمندان ${category.name}` : 'نتایج جستجو');
        } else if (query) {
             setPageTitle('نتایج جستجو');
        } else {
            setPageTitle('برترین هنرمندان');
        }
        
        // 2. Filter by search query if a query is present
        if (query) {
            const lowercasedQuery = query.toLowerCase();
            filteredResults = filteredResults
                .filter(provider => 
                    provider.name.toLowerCase().includes(lowercasedQuery) ||
                    provider.service.toLowerCase().includes(lowercasedQuery) ||
                    (provider.bio && provider.bio.toLowerCase().includes(lowercasedQuery))
                );
        }
        
        // Sort the final list by score in descending order
        filteredResults.sort((a,b) => b.score - a.score);

        setSearchResults(filteredResults);

    } catch (error) {
        console.error("Failed to fetch and rank providers:", error);
        setSearchResults([]); // Clear results on error
    } finally {
        setIsLoading(false);
    }
  }, [query, categorySlug]);

  useEffect(() => {
    performSearchAndRank();
  }, [performSearchAndRank]);


  return (
    <div className="py-12 md:py-20 flex-grow">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">
            {pageTitle}
        </h1>
        {query ? (
          <p className="mt-3 text-lg text-muted-foreground">
            نتایج برای عبارت: <span className="font-bold text-foreground">"{query}"</span>
          </p>
        ) : (
          !categorySlug && <p className="mt-3 text-lg text-muted-foreground">
            لیست هنرمندان بر اساس امتیاز و فعالیت در پلتفرم مرتب شده است.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">در حال بارگذاری و رتبه‌بندی...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {searchResults.map((provider) => (
            <SearchResultCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <SearchX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-xl">نتیجه‌ای یافت نشد</h3>
          <p className="text-muted-foreground mt-2">
            {query 
              ? "هیچ ارائه‌دهنده‌ای با عبارت جستجوی شما مطابقت نداشت. لطفا عبارت دیگری را امتحان کنید."
              : "هنوز هیچ هنرمندی در این دسته‌بندی ثبت‌نام نکرده است."
            }
          </p>
        </div>
      )}
    </div>
  );
}
