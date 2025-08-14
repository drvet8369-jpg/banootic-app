'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.phone || isLoading) {
      setUnreadCount(0);
      return;
    }

    const unsub = onSnapshot(doc(db, "inboxes", user.phone), (doc) => {
        const inboxData = doc.data() || {};
        const totalUnread = Object.values(inboxData)
          .reduce((acc: number, chat: any) => {
            const selfInfo = chat.participants?.[user.phone];
            return acc + (selfInfo?.unreadCount || 0);
          }, 0);
        setUnreadCount(totalUnread);
    });

    return () => unsub();
  }, [user, isLoading]);
  
  if (unreadCount === 0 || isLoading) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
