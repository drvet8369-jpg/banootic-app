
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

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return { error: 'پروفایل کاربری شما یافت نشد.' };
    }

    // Defensive check: Ensure the user has a name in their profile.
    if (!profile.full_name) {
        return { error: 'برای ثبت نظر، ابتدا باید نام خود را در پروفایل تکمیل کنید.' };
    }

    const { error: reviewError } = await supabase.from('reviews').insert({
        provider_id: payload.profileId,
        author_id: user.id,
        author_name: profile.full_name,
        rating: payload.rating,
        comment: payload.comment,
    });

    if (reviewError) {
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
