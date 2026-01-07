
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { decode } from 'base64-arraybuffer';
import type { PortfolioItem, Profile } from '@/lib/types';


/**
 * A secure server action that gets the current user's profile from the `profiles` table.
 * This is the single source of truth for identifying the user and their data.
 */
async function getUserProfile(): Promise<{ user: import('@supabase/supabase-js').User; profile: Profile; error: null } | { user: null; profile: null; error: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null, error: 'دسترسی غیرمجاز: کاربر وارد نشده است.' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return { user: null, profile: null, error: 'پروفایل کاربر یافت نشد.' };
    }

    return { user, profile, error: null };
}

export async function updateProviderInfoAction(values: { name: string; service: string; bio: string; }) {
    const { user, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    const supabase = createClient();

    // 1. Update the `providers` table with provider-specific info
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
    
    // 2. Also update the `full_name` in the main `profiles` table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: values.name })
        .eq('id', user!.id);
    
    if(profileError) {
        console.warn("Could not update profiles table name: ", profileError.message);
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${user!.phone}`);
    return { error: null };
}


export async function addPortfolioItemAction(base64ImageData: string) {
    const { user, profile, error: sessionError } = await getUserProfile();
    if (sessionError) return { error: sessionError };

    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `portfolio/${user!.id}/${Date.now()}`;
    const imageData = decode(base64ImageData.split(',')[1]);

    // 1. Upload the image to Supabase Storage
    const { error: uploadError } = await adminSupabase.storage
        .from('images')
        .upload(filePath, imageData, { contentType });
    
    if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        return { error: 'خطا در آپلود تصویر در استوریج: ' + uploadError.message };
    }

    // 2. Get the public URL of the uploaded image
    const { data: { publicUrl } } = adminSupabase.storage
        .from('images')
        .getPublicUrl(filePath);

    // 3. Update the `portfolio` column in the `profiles` table
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

    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `avatars/${user!.id}/${Date.now()}`;
    const imageData = decode(base64ImageData.split(',')[1]);

    // 1. Upload new image to storage
    const { error: uploadError } = await adminSupabase.storage
        .from('images')
        .upload(filePath, imageData, { contentType, upsert: true });
    
    if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        return { error: 'خطا در آپلود تصویر پروفایل: ' + uploadError.message };
    }

    // 2. Get the public URL
    const { data: { publicUrl } } = adminSupabase.storage.from('images').getPublicUrl(filePath);
    
    // 3. Update the `profile_image_url` (text column) in the `profiles` table
    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
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
    // Set the text column `profile_image_url` to null
    const { error } = await supabase
        .from('profiles')
        .update({ profile_image_url: null })
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

    const supabase = createClient();
    // Update the portfolio in the `profiles` table
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ portfolio: updatedPortfolio })
        .eq('id', user!.id);
        
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

    // Attempt to delete the file from storage
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
