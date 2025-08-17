'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getUnreadCount } from '@/lib/api';
import { useCrossTabEventListener } from '@/lib/events';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = useCallback(async () => {
    if (!user?.phone) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadCount(user.phone);
      setUnreadCount(count);
    } catch (e) {
      // Silently fail if API is not available
      setUnreadCount(0);
    }
  }, [user?.phone]);

  useEffect(() => {
    checkUnread();
    
    // Listen for updates from other tabs
    const cleanup = useCrossTabEventListener('messages-update', checkUnread);

    // Also listen to window focus event as a fallback
    window.addEventListener('focus', checkUnread);

    return () => {
      cleanup();
      window.removeEventListener('focus', checkUnread);
    };
  }, [checkUnread]);

  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
