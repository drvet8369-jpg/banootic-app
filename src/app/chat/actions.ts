
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
        // This case is unlikely if we are initiating from a real provider profile,
        // but it's good practice to handle it.
        return { error: 'Partner profile not found.' };
    }
    
    // 3. Get or create the conversation using the corrected RPC parameter names
    const { data: conversationData, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
            p_user_one_id: currentUserProfile.id,
            p_user_two_id: partnerProfile.id
        });

    if (conversationError) {
        console.error("RPC get_or_create_conversation error:", conversationError);
        return { error: 'Could not get or create conversation.' };
    }

    const conversation = conversationData ? conversationData[0] : null;
    
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
    
    // 5. Mark messages as read for this conversation
    if (conversation) {
        const { error: readError } = await supabase.rpc('mark_messages_as_read', {
            p_conversation_id: conversation.id,
            p_user_id: user.id
        });
        if (readError) {
            console.error("Error marking messages as read:", readError);
            // Non-critical, so we don't return an error to the client
        }
    }
    
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
            receiver_id: payload.receiverId,
            content: payload.content,
        });
    
    if (error) {
        console.error("Error sending message:", error);
        return { error: `Failed to send message: ${error.message}` };
    }

    return { error: null };
}

export async function editMessageAction(payload: { messageId: string; newContent: string; }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "User not authenticated" };
    }
    
    const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', payload.messageId)
        .single();
        
    if (fetchError || !message) {
        return { error: "Message not found." };
    }
    
    if (message.sender_id !== user.id) {
        return { error: "You are not authorized to edit this message." };
    }

    const { error: updateError } = await supabase
        .from('messages')
        .update({
            content: payload.newContent,
            is_edited: true,
        })
        .eq('id', payload.messageId);
    
    if (updateError) {
        console.error("Error editing message:", updateError);
        return { error: `Failed to edit message: ${updateError.message}` };
    }

    return { error: null };
}
