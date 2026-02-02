
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

interface AddReviewPayload {
    providerId: number;
    profileId: string;
    rating: number;
    comment: string;
}

export async function addReviewAction(payload: AddReviewPayload) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'برای ثبت نظر باید وارد شوید.' };
    }

    // The user's name will be fetched via a JOIN when reviews are displayed.
    // We only need to insert the ID of the author.
    const { error: reviewError } = await supabase.from('reviews').insert({
        provider_id: payload.profileId,
        author_id: user.id, // This is sufficient
        rating: payload.rating,
        comment: payload.comment,
    });

    if (reviewError) {
        // The unique constraint on (provider_id, author_id) will trigger this.
        if (reviewError.code === '23505') { 
            return { error: 'شما قبلاً برای این هنرمند نظری ثبت کرده‌اید.' };
        }
        console.error("Supabase review insert error:", reviewError);
        return { error: 'خطا در ثبت نظر: ' + reviewError.message };
    }
    
    // Recalculate average rating for the provider using an RPC function
    // for atomicity and better performance.
    const { error: rpcError } = await supabase.rpc('update_provider_rating', {
        provider_profile_id: payload.profileId
    });

    if (rpcError) {
        // This is not a critical error for the user, so we just log it.
        // The review was submitted successfully.
        console.error("Failed to update provider's average rating via RPC:", rpcError);
    }
    
    // Revalidate the provider's public page to show the new review and rating
    const { data: provider } = await supabase.from('providers').select('phone').eq('id', payload.providerId).single();
    if (provider?.phone) {
        revalidatePath(`/provider/${provider.phone}`);
    }

    return { error: null };
}
