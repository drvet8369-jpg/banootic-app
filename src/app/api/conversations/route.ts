
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Conversation, Provider, Customer } from '@/lib/types';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/server';

// This API route securely fetches the conversation list for the logged-in user.
// It uses the admin client to bypass RLS for joining user data, but filters
// conversations based on the logged-in user's ID, ensuring security.

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerComponentClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('API Auth Error:', authError);
        return NextResponse.json({ error: 'Authentication failed: کاربر شناسایی نشد.' }, { status: 401 });
    }

    try {
        const adminSupabase = createAdminClient();

        // 1. Fetch all conversations where the current user is a participant
        const { data: conversations, error: conversationsError } = await adminSupabase
            .from('conversations')
            .select(`
                id,
                created_at,
                participant_one_id,
                participant_two_id,
                last_message_at
            `)
            .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false, nullsFirst: false });
            
        if (conversationsError) throw conversationsError;
        if (!conversations || conversations.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Collect all unique user IDs from the conversations
        const userIds = new Set<string>();
        conversations.forEach(c => {
            userIds.add(c.participant_one_id);
            userIds.add(c.participant_two_id);
        });

        // 3. Fetch all user details (name, phone, account_type) for these IDs
        const { data: users, error: usersError } = await adminSupabase
            .from('users')
            .select('id, name, phone, account_type')
            .in('id', Array.from(userIds));
        if (usersError) throw usersError;
        
        // 4. Fetch profile images for providers only
        const providerIds = users.filter(u => u.account_type === 'provider').map(u => u.id);
        const { data: providers, error: providersError } = await adminSupabase
            .from('providers')
            .select('user_id, profile_image')
            .in('user_id', providerIds);
        if (providersError) throw providersError;
        
        // 5. Fetch the last message and unread count for each conversation
        // This is done in a single RPC call for efficiency
        const { data: conversationMetas, error: metaError } = await adminSupabase
            .rpc('get_conversations_metadata', { user_id: user.id });
        
        if (metaError) throw metaError;
        
        // Create maps for quick lookups
        const usersMap = new Map(users.map(u => [u.id, u]));
        const providersMap = new Map(providers.map(p => [p.user_id, p]));
        const metaMap = new Map(conversationMetas.map(m => [m.conversation_id, m]));
        

        // 6. Assemble the final data structure
        const responseData = conversations.map(convo => {
            const otherParticipantId = convo.participant_one_id === user.id ? convo.participant_two_id : convo.participant_one_id;
            const otherUser = usersMap.get(otherParticipantId);
            const otherProvider = providersMap.get(otherParticipantId);
            const meta = metaMap.get(convo.id);
            
            return {
                conversation_id: convo.id,
                other_user_id: otherParticipantId,
                other_user_name: otherUser?.name || 'کاربر ناشناس',
                other_user_phone: otherUser?.phone || '',
                other_user_profile_image: otherProvider?.profile_image || { src: null, ai_hint: null },
                last_message_content: meta?.last_message_content || null,
                last_message_at: convo.last_message_at,
                unread_count: meta?.unread_count || 0,
            };
        });

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Error fetching conversations API:', error);
        return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
    }
}
