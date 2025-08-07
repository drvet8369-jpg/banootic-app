'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useStorage } from '@/context/StorageContext';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user } = useAuth();
  const { getUnreadCount, inboxData } = useStorage(); // Listen to inboxData changes
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.phone) {
      setUnreadCount(getUnreadCount(user.phone));
    } else {
      setUnreadCount(0);
    }
  }, [user, getUnreadCount, inboxData]); // Rerun when inboxData changes

  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
