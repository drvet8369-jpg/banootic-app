'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InboxBadgeProps {
  isMenu?: boolean;
  userPhone: string | null;
}

export function InboxBadge({ isMenu = false, userPhone }: InboxBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userPhone) {
      setUnreadCount(0);
      return;
    }

    const checkUnread = () => {
      try {
        const allChatsData = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
        const totalUnread = Object.values(allChatsData)
          .filter((chat: any) => chat.members?.includes(userPhone))
          .reduce((acc: number, chat: any) => {
            const selfInfo = chat.participants?.[userPhone];
            return acc + (selfInfo?.unreadCount || 0);
          }, 0);
        setUnreadCount(totalUnread);
      } catch (e) {
        setUnreadCount(0);
      }
    };

    checkUnread();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'inbox_chats') {
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
  }, [userPhone]);

  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
