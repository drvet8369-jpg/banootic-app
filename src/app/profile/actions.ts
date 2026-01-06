
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { decode } from 'base64-arraybuffer';
import type { PortfolioItem, Profile } from '@/lib/types';


/**
 * A secure server action that gets the current user's profile.
 * It's the single source of truth for identifying the user and their data.
 */
async function getUserProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'دسترسی غیرمجاز: کاربر وارد نشده است.' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return { error: 'پروفایل کاربر یافت نشد.' };
    }

    return { user, profile: profile as Profile, error: null };
}

export async function updateProviderInfoAction(values: { name: string; service: string; bio: string; }) {
    const { user, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    const supabase = createClient();

    // Update the providers table
    const { error: providerError } = await supabase
        .from('providers')
        .update({
            name: values.name,
            service: values.service,
            bio: values.bio,
        })
        .eq('profile_id', user!.id);

    if (providerError) {
        return { error: 'خطا در به‌روزرسانی اطلاعات هنرمند: ' + providerError.message };
    }
    
    // Also update the full_name in the main profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: values.name })
        .eq('id', user!.id);
    
    if(profileError) {
        // This is not critical, but good to know if it fails.
        console.warn("Could not update profiles table name: ", profileError.message);
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${user!.phone}`);
    return { error: null };
}


export async function addPortfolioItemAction(base64ImageData: string) {
    const { user, profile, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    // --- 1. Upload to Storage (Admin Client) ---
    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `portfolio/${user!.id}/${Date.now()}`;
    const imageData = decode(base64ImageData.split(',')[1]);

    const { error: uploadError } = await adminSupabase.storage
        .from('images')
        .upload(filePath, imageData, { contentType });
    
    if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        return { error: 'خطا در آپلود تصویر در استوریج: ' + uploadError.message };
    }

    const { data: { publicUrl } } = adminSupabase.storage
        .from('images')
        .getPublicUrl(filePath);

    // --- 2. Update profiles table (User Client with RLS) ---
    const currentPortfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];
    const newItem: PortfolioItem = { src: publicUrl, aiHint: 'new work' };
    const updatedPortfolio = [...currentPortfolio, newItem];
    
    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ portfolio: updatedPortfolio })
        .eq('id', user!.id);

    if (dbError) {
        console.error("Database update error:", dbError);
        return { error: 'خطا در ذخیره آدرس تصویر در دیتابیس: ' + dbError.message };
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${user!.phone}`);
    return { error: null };
}

export async function updateProviderProfileImageAction(base64ImageData: string) {
    const { user, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    // --- 1. Upload to Storage (Admin Client) ---
    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `avatars/${user!.id}/${Date.now()}`;
    const imageData = decode(base64ImageData.split(',')[1]);

    const { error: uploadError } = await adminSupabase.storage
        .from('images')
        .upload(filePath, imageData, { contentType, upsert: true });
    
    if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        return { error: 'خطا در آپلود تصویر پروفایل: ' + uploadError.message };
    }

    const { data: { publicUrl } } = adminSupabase.storage.from('images').getPublicUrl(filePath);
    
    // --- 2. Update profiles table (User Client with RLS) ---
    const supabase = createClient();
    const newProfileImage = { src: publicUrl, aiHint: 'woman portrait' };
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ profile_image: newProfileImage })
        .eq('id', user!.id);
    
    if(dbError) return { error: 'خطا در به‌روزرسانی پروفایل: ' + dbError.message };

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${user!.phone}`);
    return { error: null };
}

export async function deleteProviderProfileImageAction() {
    const { user, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    const supabase = createClient();
    const { error } = await supabase
        .from('profiles')
        .update({ profile_image: { src: '', aiHint: 'woman portrait' }})
        .eq('id', user!.id);

    if (error) {
        return { error: 'خطا در حذف عکس پروفایل: ' + error.message };
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${user!.phone}`);
    return { error: null };
}

export async function deletePortfolioItemAction(itemSrc: string) {
    const { user, profile, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    const currentPortfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];
    
    const itemToDelete = currentPortfolio.find(item => item.src === itemSrc);
    const updatedPortfolio = currentPortfolio.filter(item => item.src !== itemSrc);

    // --- 1. Update profiles table (User Client with RLS) ---
    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ portfolio: updatedPortfolio })
        .eq('id', user!.id);
        
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

    // --- 2. Delete from Storage (Admin Client) ---
    // Try to delete from storage, but don't block if it fails.
    if (itemToDelete && itemToDelete.src) {
      try {
          const adminSupabase = createAdminClient();
          const filePath = new URL(itemToDelete.src).pathname.split('/images/')[1];
          if(filePath) {
              const { error: storageError } = await adminSupabase.storage.from('images').remove([filePath]);
              if(storageError) console.warn("Could not delete from storage: " + storageError.message);
          }
      } catch(e: any) {
          console.warn("Could not create admin client or delete from storage: " + e.message);
      }
    }

    revalidatePath(`/provider/${user!.phone}`);
    revalidatePath('/profile');
    return { error: null };
}
