
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCrossTabEventListener } from '@/lib/events';

interface InboxBadgeProps {
  isMenu?: boolean;
}

export function InboxBadge({ isMenu = false }: InboxBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const checkUnread = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setUnreadCount(data?.length || 0);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    checkUnread();

    const channel = supabase
      .channel('public:messages:inbox-badge')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user?.id}` },
          () => checkUnread()
      )
      .subscribe();
    
    // Also listen for cross-tab events
    const cleanup = useCrossTabEventListener('inbox-update', checkUnread);

    return () => {
      supabase.removeChannel(channel);
      cleanup();
    };
  }, [user?.id, checkUnread, supabase]);

  if (unreadCount === 0) {
    return null;
  }

  if (isMenu) {
     return <Badge variant="destructive" className="absolute -top-1 -right-1 scale-75 p-1">{unreadCount}</Badge>;
  }

  return <Badge variant="destructive">{unreadCount}</Badge>;
}
