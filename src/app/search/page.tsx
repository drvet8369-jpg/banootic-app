'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Provider } from '@/lib/types';
import SearchResultCard from '@/components/search-result-card';
import { SearchX, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { providers, isLoading } = useAuth();
  
  const searchResults = useMemo(() => {
    if (!providers) return [];
    
    let results: Provider[];

    if (!query) {
      // If no query, show all providers sorted by rating
      results = [...providers].sort((a, b) => b.rating - a.rating);
    } else {
      const lowercasedQuery = query.toLowerCase();
      results = providers.filter(provider => 
        provider.name.toLowerCase().includes(lowercasedQuery) ||
        provider.service.toLowerCase().includes(lowercasedQuery) ||
        (provider.bio && provider.bio.toLowerCase().includes(lowercasedQuery))
      ).sort((a, b) => b.rating - a.rating); // Sort filtered results by rating
    }
    return results;
  }, [query, providers]);


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
            نمایش تمام هنرمندان
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
