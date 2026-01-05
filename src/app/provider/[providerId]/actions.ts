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
        provider_id: payload.providerId,
        user_id: user.id,
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
    
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', payload.providerId);
    
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

export async function deletePortfolioItemAction(providerId: number, itemIndex: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'دسترسی غیرمجاز' };

    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('profile_id, phone, portfolio')
        .eq('id', providerId)
        .single();
    
    if (providerError || !provider) return { error: 'هنرمند یافت نشد.' };
    if (provider.profile_id !== user.id) return { error: 'دسترسی غیرمجاز: شما مالک این پروفایل نیستید.'};
    
    const currentPortfolio = Array.isArray(provider.portfolio) ? provider.portfolio : [];
    
    // Find the item to delete to also remove from storage
    const itemToDelete = currentPortfolio[itemIndex];

    const updatedPortfolio = currentPortfolio.filter((_, index) => index !== itemIndex);

    const { error: dbError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('id', providerId);
        
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

    // Attempt to delete from storage if URL exists
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
