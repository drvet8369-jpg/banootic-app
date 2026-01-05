
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { decode } from 'base64-arraybuffer';
import type { PortfolioItem } from '@/lib/types';


async function verifyProviderOwnership(providerId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'دسترسی غیرمجاز: کاربر وارد نشده است.' };
    }

    // Get provider to find its profile_id and phone
    const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('profile_id, phone')
        .eq('id', providerId)
        .single();
    
    if (providerError || !provider) {
        return { error: 'پروفایل هنرمند یافت نشد.' };
    }

    if (provider.profile_id !== user.id) {
        return { error: 'دسترسی غیرمجاز: شما مالک این پروفایل نیستید.' };
    }

    // Get profile to access the portfolio
    const { data: profile, error: profileDataError } = await supabase
        .from('profiles')
        .select('portfolio')
        .eq('id', user.id)
        .single();

    if(profileDataError || !profile) {
        return { error: 'پروفایل اصلی کاربر یافت نشد.' };
    }


    return { user, provider, profile, error: null };
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
    revalidatePath(`/provider/${ownership.provider.phone}`);
    return { error: null };
}


export async function addPortfolioItemAction(base64ImageData: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'دسترسی غیرمجاز: کاربر وارد نشده است.' };

    const { data: profile, error: profileError } = await supabase.from('profiles').select('portfolio').eq('id', user.id).single();
    if(profileError || !profile) return { error: 'پروفایل کاربر یافت نشد.' };
    
    const adminSupabase = createAdminClient();
    const contentType = base64ImageData.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
    const filePath = `portfolio/${user.id}/${Date.now()}`;
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

    const currentPortfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];
    const newItem: PortfolioItem = {
        src: publicUrl,
        aiHint: 'new work'
    };
    const updatedPortfolio = [...currentPortfolio, newItem];

    const { error: dbError } = await supabase
        .from('profiles')
        .update({ portfolio: updatedPortfolio })
        .eq('id', user.id);

    if (dbError) {
        return { error: 'خطا در ذخیره تصویر در دیتابیس: ' + dbError.message };
    }

    revalidatePath(`/profile`);
    // Find phone to revalidate public profile
    const {data: provider} = await supabase.from('providers').select('phone').eq('profile_id', user.id).single();
    if(provider?.phone) {
        revalidatePath(`/provider/${provider.phone}`);
    }
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
    revalidatePath(`/provider/${ownership.provider.phone}`);
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
    revalidatePath(`/provider/${ownership.provider.phone}`);
    return { error: null };
}
