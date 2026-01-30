
'use client';

import { useState, useEffect } from 'react';
import { getUnseenAgreementsCount } from '@/app/agreements/actions';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';

export function AgreementBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Don't fetch on the agreements page itself, as it will be cleared there.
    if (pathname === '/agreements') {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        const unseenCount = await getUnseenAgreementsCount();
        setCount(unseenCount);
      } catch (e) {
        // Silently fail
        console.error("Failed to fetch agreement count", e);
        setCount(0);
      }
    };

    fetchCount();

    // Poll for new agreements every 30 seconds
    const intervalId = setInterval(fetchCount, 30000);

    return () => clearInterval(intervalId);
  }, [pathname]);

  if (count === 0) {
    return null;
  }

  return <Badge variant="destructive" className="absolute top-0 right-0 h-4 w-4 justify-center p-0 scale-75 transform translate-x-1/2 -translate-y-1/2">{count}</Badge>;
}
