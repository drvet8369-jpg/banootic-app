
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
    
    // Defensive check: Ensure user has a name in their profile before allowing a review.
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (!profile?.full_name) {
        return { error: 'لطفا ابتدا ثبت‌نام خود را تکمیل کنید تا بتوانید نظر دهید.' };
    }

    // Insert the review into the database.
    const { error: reviewError } = await supabase.from('reviews').insert({
        provider_id: payload.profileId,
        author_id: user.id,
        rating: payload.rating,
        comment: payload.comment,
    });

    if (reviewError) {
        // The unique constraint, added by our migration, will trigger this error.
        if (reviewError.code === '23505') { 
            return { error: 'شما قبلاً برای این هنرمند نظری ثبت کرده‌اید.' };
        }
        console.error("Supabase review insert error:", reviewError);
        return { error: 'خطا در ثبت نظر: ' + reviewError.message };
    }
    
    // Call the new, comprehensive RPC function to update all provider statistics.
    const { error: rpcError } = await supabase.rpc('update_provider_stats', {
        p_provider_profile_id: payload.profileId
    });

    if (rpcError) {
        // This is not a critical error for the user, but it's important to log it.
        console.error("Failed to update provider stats via RPC:", rpcError);
    }
    
    // Also update the provider's last activity timestamp
    const { error: activityError } = await supabase
        .from('providers')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('profile_id', payload.profileId);

    if (activityError) {
        console.warn(`Failed to update last_activity_at for provider ${payload.profileId}:`, activityError);
    }

    // Revalidate the provider's public page to show the new review and updated stats.
    const { data: provider } = await supabase.from('providers').select('phone').eq('profile_id', payload.profileId).single();
    if (provider?.phone) {
        revalidatePath(`/provider/${provider.phone}`);
    }

    return { error: null };
}
