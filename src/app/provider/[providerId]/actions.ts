
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Provider } from '@/lib/types';

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
    
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', payload.profileId);
    
    if (reviewsError) {
        console.error("Could not fetch reviews to update average rating:", reviewsError);
        revalidatePath(`/provider/[providerId]`, 'page');
        return { error: null };
    }

    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const newAverageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    const reviewsCount = reviews.length;

    const { error: updateError } = await supabase
        .from('providers')
        .update({ rating: newAverageRating, reviews_count: reviewsCount })
        .eq('id', payload.providerId);

    if (updateError) {
        console.error("Failed to update provider's average rating:", updateError);
    }
    
    revalidatePath(`/provider/[providerId]`, 'page');
    return { error: null };
}
