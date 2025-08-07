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
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div className="bg-muted border-b w-full sticky top-16 z-40">
      <div className="container p-2">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="جستجو در میان هنرمندان و خدمات..."
            className="w-full pl-10 bg-background placeholder:font-semibold text-foreground placeholder:text-foreground/80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="جستجو">
            <Search className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
