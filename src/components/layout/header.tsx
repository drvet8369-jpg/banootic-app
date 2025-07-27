import Link from 'next/link';
import { Logo } from './logo';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the client-side heavy component with SSR turned off.
// This is the key to solving the hydration errors permanently.
const HeaderActions = dynamic(() => import('./header-actions'), {
  ssr: false,
  // Provide a skeleton loader that matches the final component's dimensions
  // to prevent layout shift.
  loading: () => (
    <div className="flex items-center gap-4 h-10">
      <div className="hidden md:flex items-center gap-2">
        <Skeleton className="w-20 h-10" />
        <Skeleton className="w-16 h-10" />
      </div>
      <div className="md:hidden">
        <Skeleton className="w-10 h-10" />
      </div>
    </div>
  ),
});

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="container flex h-16 items-center justify-between gap-4 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary-foreground" />
          <span className="font-display text-2xl font-bold whitespace-nowrap">هنربانو</span>
        </Link>
        
        <div className="flex-1" />

        {/* The client-only component is rendered here. */}
        <HeaderActions />
      </div>
    </header>
  );
}
