
'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { InboxConversation } from '@/lib/types';


export async function getConversationsForUser(): Promise<InboxConversation[]> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase.rpc('get_user_conversations_with_unread', {
        p_user_id: user.id,
    });
    
    if (error) {
        console.error("Error fetching conversations from RPC:", error);
        return [];
    }

    // The RPC function is expected to return data in the shape of InboxConversation
    return (data as InboxConversation[]) || [];
}


export async function getUnreadConversationsCount(): Promise<number> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return 0;
    }

    const { data, error } = await supabase.rpc('get_user_conversations_with_unread', {
        p_user_id: user.id,
    });
    
    if (error) {
        console.error("Error fetching conversations from RPC for count:", error);
        return 0;
    }

    if (!data) {
        return 0;
    }

    // Sum up the unread_count from all conversations
    const totalUnread = data.reduce((acc: number, convo: { unread_count: number }) => acc + (convo.unread_count || 0), 0);
    
    return totalUnread;
}
