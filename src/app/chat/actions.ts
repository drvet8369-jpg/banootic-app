
'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Gets initial data needed for the chat page.
 * It retrieves the current user's profile, the partner's profile,
 * finds or creates a conversation, and fetches the messages for it.
 */
export async function getInitialChatData(partnerPhone: string) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return { error: "User not authenticated" };
    }

    // 1. Fetch current user's profile
    const { data: currentUserProfile, error: currentUserProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (currentUserProfileError || !currentUserProfile) {
        return { error: "Current user profile not found." };
    }

    // 2. Fetch partner's profile using their phone number
    const { data: partnerProfile, error: partnerProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', partnerPhone)
        .single();

    if (partnerProfileError || !partnerProfile) {
        // Fallback for when partner is not a provider (e.g. just a customer)
        const name = `مشتری ${partnerPhone.slice(-4)}`;
        return { 
            partnerProfile: { id: partnerPhone, full_name: name, phone: partnerPhone, profile_image_url: null },
            conversation: null,
            messages: []
        };
    }
    
    // 3. Get or create the conversation
    const { data: conversationData, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
            p_one: currentUserProfile.id,
            p_two: partnerProfile.id
        });

    if (conversationError) {
        console.error("RPC get_or_create_conversation error:", conversationError);
        return { error: 'Could not get or create conversation.' };
    }

    // The RPC returns an array, so we take the first element.
    const conversation = (conversationData && conversationData.length > 0) ? conversationData[0] : null;
    
    if (!conversation) {
        return { error: 'Conversation could not be established.' };
    }

    // 4. Fetch messages for the conversation
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

    if (messagesError) {
        return { error: 'Could not fetch messages.' };
    }
    
    // 5. Mark messages as read by calling the RPC function
    // This is currently disabled as the unread_count is not fully implemented yet.
    // await supabase.rpc('mark_messages_as_read', { p_conversation_id: conversation.id, p_user_id: currentUserProfile.id });


    return {
        partnerProfile,
        conversation,
        messages: messages || []
    };
}


export async function sendMessageAction(payload: { conversationId: string; content: string; receiverId: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not authenticated" };
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            conversation_id: payload.conversationId,
            sender_id: user.id,
            content: payload.content,
        });
    
    if (error) {
        console.error("Error sending message:", error);
        return { error: 'Failed to send message.' };
    }

    return { error: null };
}
