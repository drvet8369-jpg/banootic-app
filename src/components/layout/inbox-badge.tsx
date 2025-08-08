'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user, getUnreadCount, inboxData } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.phone) {
      setUnreadCount(getUnreadCount(user.phone));
    } else {
      setUnreadCount(0);
    }
  }, [user, getUnreadCount, inboxData]);

  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
