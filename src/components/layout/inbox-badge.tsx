'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInboxData } from '@/lib/storage';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.phone) {
      setUnreadCount(0);
      return;
    }

    const checkUnread = () => {
      try {
        const allChatsData = getInboxData();
        const totalUnread = Object.values(allChatsData)
          .filter((chat: any) => chat.members?.includes(user.phone))
          .reduce((acc: number, chat: any) => {
            const selfInfo = chat.participants?.[user.phone];
            return acc + (selfInfo?.unreadCount || 0);
          }, 0);
        setUnreadCount(totalUnread);
      } catch (e) {
        setUnreadCount(0);
      }
    };

    checkUnread();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'honarbanoo_inbox_chats') {
            checkUnread();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', checkUnread);

    const intervalId = setInterval(checkUnread, 5000); 

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', checkUnread);
    };
  }, [user?.phone]);

  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
