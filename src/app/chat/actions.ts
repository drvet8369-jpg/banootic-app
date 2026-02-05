'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { revalidatePath } from 'next/cache';

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

    // 1. Fetch partner's profile using their phone number
    const { data: partnerProfile, error: partnerProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', partnerPhone)
        .single();

    if (partnerProfileError || !partnerProfile) {
        return { error: 'Partner profile not found.' };
    }
    
    // 2. Check for an accepted agreement between the two users (FIXED QUERY)
    const { data: agreement, error: agreementError } = await supabase
        .from('agreements')
        .select('status')
        .or(
            `and(customer_id.eq.${user.id},provider_id.eq.${partnerProfile.id},status.eq.accepted),` +
            `and(customer_id.eq.${partnerProfile.id},provider_id.eq.${user.id},status.eq.accepted)`
        )
        .limit(1)
        .single();
    
    if (agreementError && agreementError.code !== 'PGRST116') { // PGRST116 = no rows found, which is not an error here
        console.error("Supabase agreement check error:", agreementError);
        return { error: 'An error occurred while checking for an agreement.' };
    }

    if (!agreement) {
        return { error: 'Agreement not accepted.' };
    }

    // 3. Get or create the conversation using the corrected RPC parameter names
    const { data: conversationData, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
            p_user_one_id: user.id,
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
    
    // 5. Mark messages as read for this conversation and user
    if (conversation) {
        await supabase.rpc('mark_messages_as_read', {
            p_conversation_id: conversation.id,
            p_user_id: user.id
        });
        revalidatePath('/inbox');
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
