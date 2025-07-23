
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { providers, services } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, User, Briefcase, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SearchResult {
  providers: typeof providers;
  services: typeof services;
}

export function SearchComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const searchResults: SearchResult = useMemo(() => {
    if (!searchQuery.trim()) {
      return { providers: [], services: [] };
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    const filteredProviders = providers.filter(provider =>
      provider.name.toLowerCase().includes(lowercasedQuery) ||
      provider.service.toLowerCase().includes(lowercasedQuery)
    );
    const filteredServices = services.filter(service =>
      service.name.toLowerCase().includes(lowercasedQuery)
    );
    return { providers: filteredProviders, services: filteredServices };
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoading) setIsLoading(true);
    setSearchQuery(e.target.value);
  };
  
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300); // Simulate a small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isLoading]);

  const onResultClick = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full max-w-md mx-auto text-lg">
          <Search className="ml-2 h-5 w-5" />
          جستجوی هنرمند یا خدمات
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] flex flex-col h-full max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>جستجو</DialogTitle>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="نام هنرمند یا نوع خدمات را وارد کنید..."
                className="w-full h-11 pr-10"
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
            />
        </div>

        <div className="flex-grow overflow-y-auto -mx-6 px-6 py-2">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (searchQuery.trim() && searchResults.providers.length === 0 && searchResults.services.length === 0) ? (
                <p className="p-8 text-center text-sm text-muted-foreground">هیچ نتیجه‌ای یافت نشد.</p>
            ) : (searchQuery.trim() &&
                <ul className="space-y-1">
                  {searchResults.providers.length > 0 && (
                     <li className="text-xs font-semibold text-muted-foreground px-2 pt-1">هنرمندان</li>
                  )}
                  {searchResults.providers.map(provider => (
                    <li key={`p-${provider.id}`}>
                      <Link href={`/provider/${provider.id}`} onClick={onResultClick}>
                         <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                            <User className="h-4 w-4 text-accent" />
                            <div className="flex-grow">
                                <p className="text-sm font-semibold">{provider.name}</p>
                                <p className="text-xs text-muted-foreground">{provider.service}</p>
                            </div>
                         </div>
                      </Link>
                    </li>
                  ))}
                  {searchResults.services.length > 0 && (
                     <li className="text-xs font-semibold text-muted-foreground px-2 pt-2">خدمات</li>
                  )}
                   {searchResults.services.map(service => (
                    <li key={`s-${service.slug}`}>
                       <Link href={`/services/${service.categorySlug}/${service.slug}`} onClick={onResultClick}>
                         <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                            <Briefcase className="h-4 w-4 text-accent" />
                            <p className="text-sm font-semibold">{service.name}</p>
                         </div>
                      </Link>
                    </li>
                  ))}
                </ul>
            )}
             {!searchQuery.trim() && (
                 <div className="text-center text-muted-foreground pt-12">
                     <p>برای پیدا کردن هنرمندان یا خدمات مورد نظر، شروع به تایپ کنید.</p>
                 </div>
             )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
