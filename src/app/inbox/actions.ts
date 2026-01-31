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

    // Call the new, more efficient function
    const { data, error } = await supabase.rpc('get_total_unread_message_count', {
        p_user_id: user.id,
    });
    
    if (error) {
        // Updated error message for clarity
        console.error("Error fetching total unread message count:", error);
        return 0;
    }
    
    // The new function directly returns the count
    return data ?? 0;
}
