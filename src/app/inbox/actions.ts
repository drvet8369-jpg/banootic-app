
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

    const { data, error } = await supabase.rpc('get_user_conversations_with_unread');
    
    if (error) {
        console.error("Error fetching conversations from RPC:", error);
        return [];
    }

    // The RPC function is expected to return data in the shape of InboxConversation
    return data as InboxConversation[];
}
