import { getProviders } from '@/lib/data';
import SearchResultCard from '@/components/search-result-card';
import { SearchX } from 'lucide-react';
import type { Provider } from '@/lib/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface SearchResultsProps {
  query: string;
}

async function SearchResults({ query }: SearchResultsProps) {
  // Use the Supabase-powered getProviders function
  const searchResults: Provider[] = await getProviders({ searchQuery: query });

  return (
    <>
      {searchResults.length > 0 ? (
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
    </>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams?.q as string || '';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">نتایج جستجو</h1>
        {query ? (
          <p className="mt-3 text-lg text-muted-foreground">
            برای عبارت: <span className="font-bold text-foreground">"{query}"</span>
          </p>
        ) : (
          <p className="mt-3 text-lg text-muted-foreground">
            لطفا عبارتی را برای جستجو وارد کنید.
          </p>
        )}
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }>
         <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
