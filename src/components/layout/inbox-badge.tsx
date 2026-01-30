
'use client';

import { useState, useEffect } from 'react';
import { getUnreadConversationsCount } from '@/app/inbox/actions';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';

export function InboxBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // If we are inside a chat, we don't need to poll or show the badge count.
    if (pathname.startsWith('/chat/')) {
        setCount(0);
        return;
    }

    const fetchCount = async () => {
      try {
        const unreadCount = await getUnreadConversationsCount();
        setCount(unreadCount);
      } catch (e) {
        console.error("Failed to fetch unread conversations count", e);
        setCount(0);
      }
    };

    fetchCount();
    // Poll for new messages every 15 seconds, more frequently than agreements
    const intervalId = setInterval(fetchCount, 15000); 

    return () => clearInterval(intervalId);
  }, [pathname]);

  if (count === 0) {
    return null;
  }

  // Same style as agreement badge
  return <Badge variant="destructive" className="absolute top-1 right-1 h-4 w-4 justify-center p-0 text-[10px] scale-90 transform translate-x-1/2 -translate-y-1/2">{count}</Badge>;
}
