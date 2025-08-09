'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user, inboxData, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const calculateUnread = useCallback(() => {
    if (!user?.phone || !inboxData) {
      setUnreadCount(0);
      return;
    }
    const totalUnread = Object.values(inboxData)
      .filter((chat: any) => chat.members?.includes(user.phone))
      .reduce((acc: number, chat: any) => {
        const selfInfo = chat.participants?.[user.phone];
        return acc + (selfInfo?.unreadCount || 0);
      }, 0);
    setUnreadCount(totalUnread);
  }, [user, inboxData]);

  useEffect(() => {
    if(!isLoading){
        calculateUnread();
    }
  }, [isLoading, calculateUnread]);
  
  if (unreadCount === 0 || isLoading) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
