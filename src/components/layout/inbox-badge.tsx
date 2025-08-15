'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getDb } from '@/lib/firebase';
import { doc, onSnapshot } from "firebase/firestore";

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

    let unsubscribe: () => void;
    
    const setupListener = async () => {
        const db = await getDb();
        const inboxRef = doc(db, "inboxes", user.phone);
        unsubscribe = onSnapshot(inboxRef, (doc) => {
            if (doc.exists()) {
                const inboxData = doc.data();
                const totalUnread = Object.values(inboxData).reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
                setUnreadCount(totalUnread);
            } else {
                setUnreadCount(0);
            }
        }, (error) => {
            console.error("Error listening to inbox:", error);
            setUnreadCount(0);
        });
    };

    setupListener();

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
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
