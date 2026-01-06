
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface AddReviewPayload {
    providerId: number; // The numeric id of the provider from the 'providers' table
    profileId: string; // The UUID of the provider's profile
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
        provider_id: payload.profileId, // Use the UUID to link the review
        author_id: user.id,
        author_name: profile.full_name,
        rating: payload.rating,
        comment: payload.comment,
    });

    if (reviewError) {
        if (reviewError.code === '23505') { // unique constraint violation
            return { error: 'شما قبلاً برای این هنرمند نظری ثبت کرده‌اید.' };
        }
        return { error: 'خطا در ثبت نظر: ' + reviewError.message };
    }
    
    // Now, update the provider's average rating using the numeric providerId
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
        .eq('id', payload.providerId); // Use the numeric ID to find the provider row

    if (updateError) {
        console.error("Failed to update provider's average rating:", updateError);
    }
    
    revalidatePath(`/provider/[providerId]`, 'page');
    return { error: null };
}

export async function deletePortfolioItemAction(providerId: number, itemSrc: string) {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { error: 'دسترسی غیرمجاز' };

    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('profile_id, portfolio, phone')
        .eq('id', providerId)
        .single();

    if (providerError || !provider) return { error: 'پروفایل هنرمند یافت نشد.' };
    if (provider.profile_id !== user.id) return { error: 'دسترسی غیرمجاز' };

    const currentPortfolio = Array.isArray(provider.portfolio) ? provider.portfolio : [];
    
    const itemToDelete = currentPortfolio.find(item => item.src === itemSrc);
    const updatedPortfolio = currentPortfolio.filter(item => item.src !== itemSrc);

    const { error: dbError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('id', providerId);
        
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

    if (itemToDelete && itemToDelete.src) {
      try {
          const adminSupabase = createAdminClient();
          const filePath = itemToDelete.src.split('/images/')[1];
          if(filePath) {
              const { error: storageError } = await adminSupabase.storage.from('images').remove([filePath]);
              if(storageError) console.warn("Could not delete from storage: " + storageError.message);
          }
      } catch(e: any) {
          console.warn("Could not create admin client to delete from storage: " + e.message);
      }
    }

    revalidatePath(`/provider/${provider.phone}`);
    revalidatePath('/profile');
    return { error: null };
}
