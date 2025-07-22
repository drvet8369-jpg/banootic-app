
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { categories, providers, services } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette, ChefHat, Scissors, Gift, Search, Briefcase, User } from 'lucide-react';
import { Logo } from '@/components/layout/logo';

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

interface SearchResult {
  providers: typeof providers;
  services: typeof services;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

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
    setSearchQuery(e.target.value);
  };


  return (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-24 w-full">
        <Logo className="mx-auto mb-6 h-32 w-32 text-primary-foreground" />
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-accent-foreground/80">
          هنربانو
        </h1>
        <p className="mt-4 font-headline text-xl md:text-2xl text-primary-foreground">
          با دستان هنرمندت بدرخش
        </p>
        <p className="mt-4 text-lg md:text-xl text-primary-foreground max-w-2xl mx-auto">
          بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی زیبا، بهترین هنرمندان محلی را اینجا پیدا کنید.
        </p>
        
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="جستجوی هنرمند یا خدمات..."
              className="w-full h-12 text-lg pl-4 pr-12 rounded-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="mt-6 max-w-xl mx-auto text-left">
            <Card>
              <CardContent className="p-4">
                {(searchResults.providers.length === 0 && searchResults.services.length === 0) ? (
                  <p className="text-center text-muted-foreground">هیچ نتیجه‌ای یافت نشد.</p>
                ) : (
                  <ul className="space-y-3">
                    {searchResults.providers.length > 0 && (
                       <li className="text-sm font-semibold text-muted-foreground px-2 pt-2">هنرمندان</li>
                    )}
                    {searchResults.providers.map(provider => (
                      <li key={`p-${provider.id}`}>
                        <Link href={`/provider/${provider.id}`}>
                           <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                              <User className="h-5 w-5 text-accent" />
                              <div className="flex-grow">
                                  <p className="font-semibold">{provider.name}</p>
                                  <p className="text-sm text-muted-foreground">{provider.service}</p>
                              </div>
                           </div>
                        </Link>
                      </li>
                    ))}
                    {searchResults.services.length > 0 && (
                       <li className="text-sm font-semibold text-muted-foreground px-2 pt-4">خدمات</li>
                    )}
                     {searchResults.services.map(service => (
                      <li key={`s-${service.slug}`}>
                         <Link href={`/services/${service.categorySlug}/${service.slug}`}>
                           <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                              <Briefcase className="h-5 w-5 text-accent" />
                              <p className="font-semibold">{service.name}</p>
                           </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </section>

      {!searchQuery.trim() && (
        <section id="categories" className="py-16 w-full">
          <h2 className="text-3xl font-headline font-bold text-center mb-12">خدمات ما</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => {
              const Icon = iconMap[category.slug];
              return (
                <Link href={`/services/${category.slug}`} key={category.id}>
                  <Card className="h-full flex flex-col items-center text-center p-6 hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                    <CardHeader className="items-center">
                      {Icon && <Icon className="w-20 h-20 mb-4 text-accent" />}
                      <CardTitle className="font-headline text-2xl">{category.name}</CardTitle>
                    </CardHeader>
                    <CardDescription>{category.description}</CardDescription>
                  </Card>
                </Link>
              );
            })}
          </div>
           <div className="mt-12 text-center">
              <Button asChild variant="secondary" size="lg" className="text-lg">
                <Link href="/register">هنرمند هستید؟ ثبت‌نام کنید</Link>
              </Button>
            </div>
        </section>
      )}
    </div>
  );
}
