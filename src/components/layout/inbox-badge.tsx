'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { state } = useAuth();
  const { user, isLoading, inboxData } = state;

  const unreadCount = useMemo(() => {
    if (!user || isLoading) return 0;
    
    return Object.values(inboxData)
      .reduce((acc: number, chat: any) => {
        if (!chat.members?.includes(user.phone)) return acc;
        const selfInfo = chat.participants?.[user.phone];
        return acc + (selfInfo?.unreadCount || 0);
      }, 0);
  }, [user, isLoading, inboxData]);
  
  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
