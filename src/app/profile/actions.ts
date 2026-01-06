
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { decode } from 'base64-arraybuffer';
import type { PortfolioItem } from '@/lib/types';


/**
 * A secure server action that identifies the provider using the current user's session.
 * It removes the need to pass a provider ID from the client.
 */
async function getProviderFromSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'دسترسی غیرمجاز: کاربر وارد نشده است.' };
    }

    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', user.id)
        .single();
    
    if (providerError || !provider) {
        return { error: 'پروفایل هنرمند یافت نشد.' };
    }

    return { user, provider, error: null };
}

export async function updateProviderInfoAction(values: { name: string; service: string; bio: string; }) {
    const { user, provider, error: sessionError } = await getProviderFromSession();
    if (sessionError) return { error: sessionError };

    const supabase = createClient();
    const { error } = await supabase
        .from('providers')
        .update({
            name: values.name,
            service: values.service,
            bio: values.bio,
        })
        .eq('id', provider.id);

    if (error) {
        return { error: 'خطا در به‌روزرسانی اطلاعات: ' + error.message };
    }
    
    // Also update the full_name in the main profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: values.name })
        .eq('id', user!.id);
    
    if(profileError) {
        console.warn("Could not update profiles table name: ", profileError.message);
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${provider.phone}`);
    return { error: null };
}


export async function addPortfolioItemAction(base64ImageData: string) {
    const { user, provider, error: sessionError } = await getProviderFromSession();
    if (sessionError) return { error: sessionError };

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

    const currentPortfolio = Array.isArray(provider.portfolio) ? provider.portfolio : [];
    const newItem: PortfolioItem = {
        src: publicUrl,
        aiHint: 'new work'
    };
    const updatedPortfolio = [...currentPortfolio, newItem];
    
    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('id', provider.id);

    if (dbError) {
        console.error("Database update error:", dbError);
        return { error: 'خطا در ذخیره آدرس تصویر در دیتابیس: ' + dbError.message };
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${provider.phone}`);
    return { error: null };
}

export async function updateProviderProfileImageAction(base64ImageData: string) {
    const { user, provider, error: sessionError } = await getProviderFromSession();
    if (sessionError) return { error: sessionError };

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

    const { data: { publicUrl } } = adminSupabase.storage
        .from('images')
        .getPublicUrl(filePath);
    
    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('providers')
        .update({ profile_image: { src: publicUrl, aiHint: 'woman portrait' } })
        .eq('id', provider.id);
    
    if(dbError) return { error: 'خطا در به‌روزرسانی پروفایل: ' + dbError.message };

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${provider.phone}`);
    return { error: null };
}

export async function deleteProviderProfileImageAction() {
    const { provider, error: sessionError } = await getProviderFromSession();
    if (sessionError) return { error: sessionError };

    const supabase = createClient();
    const { error } = await supabase
        .from('providers')
        .update({ profile_image: { src: '', aiHint: 'woman portrait' }})
        .eq('id', provider.id);

    if (error) {
        return { error: 'خطا در حذف عکس پروفایل: ' + error.message };
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${provider.phone}`);
    return { error: null };
}

export async function deletePortfolioItemAction(itemSrc: string) {
    const { provider, error: sessionError } = await getProviderFromSession();
    if (sessionError) return { error: sessionError };

    const currentPortfolio = Array.isArray(provider.portfolio) ? provider.portfolio : [];
    
    const itemToDelete = currentPortfolio.find(item => item.src === itemSrc);
    const updatedPortfolio = currentPortfolio.filter(item => item.src !== itemSrc);

    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('id', provider.id);
        
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

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
          console.warn("Could not create admin client to delete from storage: " + e.message);
      }
    }

    revalidatePath(`/provider/${provider.phone}`);
    revalidatePath('/profile');
    return { error: null };
}
