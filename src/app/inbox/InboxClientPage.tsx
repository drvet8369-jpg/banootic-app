'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { InboxConversation } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';

const getInitials = (name: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1 && names[1] && !isNaN(parseInt(names[1]))) {
      return name.substring(0, 2);
  }
  if (names.length > 1 && names[1]) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};

export function InboxClientPage({ initialConversations }: { initialConversations: InboxConversation[] }) {
    const [conversations, setConversations] = useState(initialConversations);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const channel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMessage = payload.new as { conversation_id: string; content: string; created_at: string; sender_id: string; receiver_id: string };

                    // Only process if the user is part of this conversation
                    if (newMessage.sender_id !== user.id && newMessage.receiver_id !== user.id) {
                        return;
                    }

                    setConversations(prevConvos => {
                        const convoIndex = prevConvos.findIndex(c => c.id === newMessage.conversation_id);
                        if (convoIndex > -1) {
                            // Update existing conversation
                            const updatedConvo = {
                                ...prevConvos[convoIndex],
                                last_message_content: newMessage.content,
                                last_message_at: newMessage.created_at,
                                unread_count: newMessage.receiver_id === user.id 
                                    ? (prevConvos[convoIndex].unread_count || 0) + 1 
                                    : prevConvos[convoIndex].unread_count,
                            };
                            const newConvos = [...prevConvos];
                            newConvos.splice(convoIndex, 1); // Remove from old position
                            return [updatedConvo, ...newConvos]; // Add to the top
                        }
                        // Note: This real-time logic doesn't handle creating a brand new conversation entry.
                        // A full refresh would be needed for that, which is an acceptable trade-off.
                        return prevConvos;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <div className="space-y-4">
            {conversations.map((convo) => (
                <Link href={`/chat/${convo.other_participant_phone}`} key={convo.id}>
                    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12 ml-4">
                           {convo.other_participant_profile_image_url && <AvatarImage src={convo.other_participant_profile_image_url} alt={convo.other_participant_full_name} />}
                            <AvatarFallback>{getInitials(convo.other_participant_full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold">{convo.other_participant_full_name}</h4>
                                {convo.last_message_at && (
                                    <p className="text-xs text-muted-foreground flex-shrink-0">
                                        {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true, locale: faIR })}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-base text-muted-foreground truncate font-semibold">{convo.last_message_content}</p>
                                {convo.unread_count > 0 && (
                                    <Badge variant="destructive" className="flex-shrink-0">{convo.unread_count}</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
