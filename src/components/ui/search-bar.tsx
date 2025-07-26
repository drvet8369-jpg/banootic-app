
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
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="bg-muted w-full p-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="جستجو در میان هنرمندان و خدمات..."
            className="w-full pr-10 bg-background placeholder:font-semibold text-foreground placeholder:text-foreground/60"
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
