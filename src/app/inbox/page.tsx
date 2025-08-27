
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { useCrossTabEventListener } from '@/lib/events';
import type { ConversationSummary } from '@/lib/types';

const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1 && names[1] && !isNaN(parseInt(names[1]))) {
      return `${names[0][0]}${names[1][0]}`;
  }
   if(names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

export default function InboxPage() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
        const response = await fetch('/api/conversations');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch conversations');
        }
        const data = await response.json();
        setConversations(data);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        setConversations([]);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      fetchConversations();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [isLoggedIn, fetchConversations, isAuthLoading]);

  // Real-time updates for inbox
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-inbox-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
            // A new message was inserted or updated, refetch all conversations
            // to get the latest state (last message, unread count, etc.)
            fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchConversations]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
        <p className="text-muted-foreground mt-2">برای مشاهده صندوق ورودی باید وارد حساب کاربری خود شوید.</p>
        <Button asChild className="mt-6"><Link href="/login">ورود به حساب کاربری</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی</CardTitle>
          <CardDescription>آخرین گفتگوهای خود را در اینجا مشاهده کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 && !isLoading ? (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
              <p className="text-muted-foreground mt-2">
                {user.accountType === 'provider'
                  ? 'وقتی پیامی از مشتریان دریافت کنید، در اینجا نمایش داده می‌شود.'
                  : 'برای شروع، یک هنرمند را پیدا کرده و به او پیام دهید.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((convo) => (
                <Link href={`/chat/${convo.other_user_phone}`} key={convo.conversation_id}>
                  <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar className="h-12 w-12 ml-4">
                      {convo.other_user_profile_image?.src && <AvatarImage src={convo.other_user_profile_image.src} alt={convo.other_user_name} />}
                      <AvatarFallback>{getInitials(convo.other_user_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold">{convo.other_user_name}</h4>
                        {convo.last_message_at && (
                          <p className="text-xs text-muted-foreground flex-shrink-0">
                            {isClient ? formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true, locale: faIR }) : '...'}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-muted-foreground truncate font-semibold">{convo.last_message_content || 'هنوز پیامی رد و بدل نشده'}</p>
                        {convo.unread_count > 0 && (
                          <Badge variant="destructive" className="flex-shrink-0">{convo.unread_count}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
