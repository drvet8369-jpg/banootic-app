'use client';

import Header from '@/components/layout/header';
import SearchBar from '@/components/ui/search-bar';
import Footer from '@/components/layout/footer';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();

  const showSearchBar = isLoggedIn || pathname === '/' || pathname.startsWith('/search') || pathname.startsWith('/services');

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      {showSearchBar && <SearchBar />}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
