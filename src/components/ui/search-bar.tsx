'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    // Always navigate to the search page.
    // The search page logic will handle showing all providers if the query is empty.
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-muted border-b w-full">
      <div className="container p-2">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="جستجو در میان هنرمندان و خدمات..."
            className="w-full pr-10 bg-background placeholder:font-semibold text-foreground placeholder:text-foreground/60 border-2 border-primary/40 focus-visible:ring-primary/80 focus-visible:ring-offset-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
