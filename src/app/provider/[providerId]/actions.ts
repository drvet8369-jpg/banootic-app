
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface AddReviewPayload {
    providerId: number;
    rating: number;
    comment: string;
}

export async function addReviewAction(payload: AddReviewPayload) {
    const supabase = createClient();

    // 1. Check for authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'برای ثبت نظر باید وارد شوید.' };
    }

    // 2. Get user's profile to get their name
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return { error: 'پروفایل کاربری شما یافت نشد.' };
    }

    // 3. Insert the new review
    const { error: reviewError } = await supabase.from('reviews').insert({
        provider_id: payload.providerId,
        user_id: user.id,
        author_name: profile.full_name,
        rating: payload.rating,
        comment: payload.comment,
    });

    if (reviewError) {
        // Handle cases where a user might try to review twice if you have a unique constraint
        if (reviewError.code === '23505') {
            return { error: 'شما قبلاً برای این هنرمند نظری ثبت کرده‌اید.' };
        }
        return { error: 'خطا در ثبت نظر: ' + reviewError.message };
    }
    
    // 4. After inserting, recalculate and update the provider's average rating
    // This is best done in a database function for performance, but we can do it here for simplicity.
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', payload.providerId);
    
    if (reviewsError) {
        console.error("Could not fetch reviews to update average rating:", reviewsError);
        revalidatePath(`/provider/[providerId]`, 'page');
        return { error: null }; // Return success, but log the rating update issue
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
    
    // 5. Revalidate the path to show the new review instantly
    revalidatePath(`/provider/[providerId]`, 'page');

    return { error: null };
}

export async function deletePortfolioItemAction(portfolioItemId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'دسترسی غیرمجاز' };

    // First, find the provider_id and image_url for this item
    const { data: item, error: itemError } = await supabase
        .from('portfolio_items')
        .select('provider_id, image_url, providers(phone)')
        .eq('id', portfolioItemId)
        .single();

    if (itemError || !item || !item.providers) return { error: 'نمونه کار یافت نشد.' };

    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('profile_id')
        .eq('id', item.provider_id)
        .single();
    
    if (providerError || !provider) return { error: 'هنرمند یافت نشد.' };
    if (provider.profile_id !== user.id) return { error: 'دسترسی غیرمجاز: شما مالک این پروفایل نیستید.'};
    
    // Delete from database
    const { error: dbError } = await supabase.from('portfolio_items').delete().eq('id', portfolioItemId);
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

    // Delete from storage
    try {
        const adminSupabase = createAdminClient();
        const filePath = item.image_url.split('/images/')[1];
        if(filePath) {
            const { error: storageError } = await adminSupabase.storage.from('images').remove([filePath]);
            if(storageError) console.warn("Could not delete from storage: " + storageError.message);
        }
    } catch(e: any) {
        console.warn("Could not create admin client to delete from storage: " + e.message);
    }

    revalidatePath(`/provider/${item.providers.phone}`);
    revalidatePath('/profile');
    return { error: null };
}
    
