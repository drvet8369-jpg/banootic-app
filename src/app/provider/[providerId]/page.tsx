
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getProviders } from '@/lib/data';
import type { Provider } from '@/lib/types';
import SearchResultCard from '@/components/search-result-card';
import { Loader2 } from 'lucide-react';

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProviderData = useCallback(() => {
    setIsLoading(true);
    // Always get the freshest data from localStorage
    const allProviders = getProviders();
    // The providerId from the URL is the phone number
    const foundProvider = allProviders.find(p => p.phone === providerId);
    
    if (foundProvider) {
      setProvider(foundProvider);
    } else {
      setProvider(null);
    }
    
    setIsLoading(false);
  }, [providerId]);

  useEffect(() => {
    loadProviderData();
  }, [loadProviderData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!provider) {
    // If after loading, the provider is still not found, show a 404 page.
    notFound();
  }

  return (
    <div className="py-12 md:py-20 flex justify-center">
      <div className="max-w-2xl w-full">
        <SearchResultCard provider={provider} />
      </div>
    </div>
  );
}
