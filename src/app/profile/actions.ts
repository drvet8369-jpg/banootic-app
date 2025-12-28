
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { decode } from 'base64-arraybuffer';

async function verifyProviderOwnership(providerId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'دسترسی غیرمجاز: کاربر وارد نشده است.' };
    }

    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('profile_id')
        .eq('id', providerId)
        .single();
    
    if (providerError || !provider) {
        return { error: 'پروفایل هنرمند یافت نشد.' };
    }

    if (provider.profile_id !== user.id) {
        return { error: 'دسترسی غیرمجاز: شما مالک این پروفایل نیستید.' };
    }

    return { user, error: null };
}

export async function updateProviderInfoAction(providerId: number, values: { name: string; service: string; bio: string; }) {
    const ownership = await verifyProviderOwnership(providerId);
    if (ownership.error) return ownership;

    const supabase = createClient();
    const { error } = await supabase
        .from('providers')
        .update({
            name: values.name,
            service: values.service,
            bio: values.bio,
        })
        .eq('id', providerId);

    if (error) {
        return { error: 'خطا در به‌روزرسانی اطلاعات: ' + error.message };
    }
    
    // Also update the full_name in the profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: values.name })
        .eq('id', ownership.user.id);
    
    if(profileError) {
        console.warn("Could not update profiles table name: ", profileError.message);
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${ownership.user.phone}`);
    return { error: null };
}


export async function addPortfolioItemAction(providerId: number, base64ImageData: string) {
    const ownership = await verifyProviderOwnership(providerId);
    if (ownership.error) return ownership;
    
    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `portfolio/${ownership.user.id}/${Date.now()}`;
    const imageData = decode(base64ImageData.split(',')[1]);

    const { error: uploadError } = await adminSupabase.storage
        .from('images')
        .upload(filePath, imageData, { contentType });
    
    if (uploadError) {
        return { error: 'خطا در آپلود تصویر: ' + uploadError.message };
    }

    const { data: { publicUrl } } = adminSupabase.storage
        .from('images')
        .getPublicUrl(filePath);

    const supabase = createClient();
    const { error: dbError } = await supabase.from('portfolio_items').insert({
        provider_id: providerId,
        image_url: publicUrl,
        ai_hint: 'new work'
    });

    if (dbError) {
        return { error: 'خطا در ذخیره تصویر در دیتابیس: ' + dbError.message };
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${ownership.user.phone}`);
    return { error: null };
}

export async function deletePortfolioItemAction(portfolioItemId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'دسترسی غیرمجاز' };

    // First, find the provider_id and image_url for this item
    const { data: item, error: itemError } = await supabase
        .from('portfolio_items')
        .select('provider_id, image_url')
        .eq('id', portfolioItemId)
        .single();

    if (itemError || !item) return { error: 'نمونه کار یافت نشد.' };

    const ownership = await verifyProviderOwnership(item.provider_id);
    if (ownership.error) return ownership;
    
    // Delete from database
    const { error: dbError } = await supabase.from('portfolio_items').delete().eq('id', portfolioItemId);
    if (dbError) return { error: 'خطا در حذف از دیتابیس: ' + dbError.message };

    // Delete from storage
    const adminSupabase = createAdminClient();
    const filePath = item.image_url.split('/images/')[1];
    const { error: storageError } = await adminSupabase.storage.from('images').remove([filePath]);
    if(storageError) console.warn("Could not delete from storage: " + storageError.message);


    revalidatePath(`/provider/${ownership.user.phone}`);
    return { error: null };
}

export async function updateProviderProfileImageAction(providerId: number, base64ImageData: string) {
    const ownership = await verifyProviderOwnership(providerId);
    if (ownership.error) return ownership;

    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `avatars/${ownership.user.id}/${Date.now()}`;
    const imageData = decode(base64ImageData.split(',')[1]);

    const { error: uploadError } = await adminSupabase.storage
        .from('images')
        .upload(filePath, imageData, { contentType, upsert: true });
    
    if (uploadError) {
        return { error: 'خطا در آپلود تصویر: ' + uploadError.message };
    }

    const { data: { publicUrl } } = adminSupabase.storage
        .from('images')
        .getPublicUrl(filePath);
    
    const supabase = createClient();
    const { error: dbError } = await supabase
        .from('providers')
        .update({ profile_image: { src: publicUrl, aiHint: 'woman portrait' } })
        .eq('id', providerId);
    
    if(dbError) return { error: 'خطا در به‌روزرسانی پروفایل: ' + dbError.message };

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${ownership.user.phone}`);
    return { error: null };
}

export async function deleteProviderProfileImageAction(providerId: number) {
    const ownership = await verifyProviderOwnership(providerId);
    if (ownership.error) return ownership;

    const supabase = createClient();
    const { error } = await supabase
        .from('providers')
        .update({ profile_image: { src: '', aiHint: 'woman portrait' }}) // Set to empty
        .eq('id', providerId);

    if (error) {
        return { error: 'خطا در حذف عکس پروفایل: ' + error.message };
    }

    revalidatePath(`/profile`);
    revalidatePath(`/provider/${ownership.user.phone}`);
    return { error: null };
}

    