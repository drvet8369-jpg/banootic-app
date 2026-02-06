'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PortfolioItem, Profile } from '@/lib/types';


// --- AI Action ---
interface GenerateBioPayload {
    providerName: string;
    serviceType: string;
}

export async function generateBioAction(payload: GenerateBioPayload): Promise<{ biography: string | null; error: string | null; }> {
    // This function now calls our internal API route.
    try {
        // The fetch URL must be absolute when called from a Server Action.
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003';
        const response = await fetch(`${baseUrl}/api/ai/generate-bio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            // If response is not ok, result.error should contain the message from the API route.
            throw new Error(result.error || `Request failed with status ${response.status}`);
        }

        return { biography: result.biography, error: null };
    } catch (e: any) {
        console.error("Error in generateBioAction:", e);
        return { biography: null, error: e.message || "An unknown error occurred while generating the biography." };
    }
}


// --- Profile Data Actions ---
interface ProviderUpdatePayload {
    name: string;
    service: string;
    bio: string;
}

export async function updateProviderInfoAction(payload: ProviderUpdatePayload) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required.' };

    const { error } = await supabase
        .from('providers')
        .update({
            name: payload.name,
            service: payload.service,
            bio: payload.bio,
            last_activity_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id);
    
    if (error) {
        console.error("Error updating provider info:", error);
        return { error: error.message };
    }
    
    // Also update full_name in profiles table to keep them in sync.
    const { error: profileNameError } = await supabase
      .from('profiles')
      .update({ full_name: payload.name })
      .eq('id', user.id);

    if (profileNameError) {
       console.error("Error updating profile name:", profileNameError);
       // Not a fatal error, so we don't return it to the user.
    }

    revalidatePath('/profile');
    revalidatePath('/provider/[providerId]', 'layout');
    return { error: null };
}

// Helper to upload a base64 encoded image to a Supabase storage bucket
async function uploadImageFromBase64(base64: string, bucket: string, userId: string) {
    const supabase = createClient();
    const contentType = base64.match(/data:(.*);base64/)?.[1] || 'image/png';
    const base64Data = base64.split('base64,')[1];
    if (!base64Data) {
        return { data: null, error: 'Invalid base64 data.' };
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `${userId}/${Date.now()}`;
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, { contentType, upsert: true });
    
    if (error) {
        return { data: null, error: error.message };
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { data: { publicUrl, path: data.path }, error: null };
}

export async function addPortfolioItemAction(base64Image: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required.' };

    const { data: uploadData, error: uploadError } = await uploadImageFromBase64(base64Image, 'portfolio_images', user.id);
    if (uploadError) return { error: uploadError };

    const { data: profile, error: profileError } = await supabase.from('profiles').select('portfolio').eq('id', user.id).single();
    if (profileError) return { error: profileError.message };

    const newPortfolioItem: PortfolioItem = { src: uploadData!.publicUrl, aiHint: 'new work' };
    const updatedPortfolio = profile.portfolio ? [...profile.portfolio, newPortfolioItem] : [newPortfolioItem];
    
    const { error: updateError } = await supabase.from('profiles').update({ portfolio: updatedPortfolio }).eq('id', user.id);
    if (updateError) return { error: updateError.message };

    revalidatePath('/profile');
    revalidatePath('/provider/[providerId]', 'layout');
    return { error: null };
}

export async function updateProviderProfileImageAction(base64Image: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required.' };

    const { data: uploadData, error: uploadError } = await uploadImageFromBase64(base64Image, 'profile_images', user.id);
    if (uploadError) return { error: uploadError };

    const { error: updateError } = await supabase.from('profiles').update({ profile_image_url: uploadData!.publicUrl }).eq('id', user.id);
    if (updateError) return { error: updateError.message };
    
    revalidatePath('/profile');
    revalidatePath('/', 'layout'); // Revalidate layout to update header avatar
    return { error: null };
}

export async function deleteProviderProfileImageAction() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required.' };

    // Set URL to null. We don't delete from storage to prevent broken links if needed later.
    const { error } = await supabase.from('profiles').update({ profile_image_url: null }).eq('id', user.id);
    if (error) return { error: error.message };

    revalidatePath('/profile');
    revalidatePath('/', 'layout');
    return { error: null };
}

export async function deletePortfolioItemAction(itemSrc: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication required.' };

    const { data: profile, error: profileError } = await supabase.from('profiles').select('portfolio').eq('id', user.id).single();
    if (profileError) return { error: profileError.message };
    if (!profile.portfolio) return { error: "Portfolio is already empty." };

    const updatedPortfolio = (profile.portfolio as PortfolioItem[]).filter(item => item.src !== itemSrc);

    const { error: updateError } = await supabase.from('profiles').update({ portfolio: updatedPortfolio }).eq('id', user.id);
    if (updateError) return { error: updateError.message };

    // We can also delete the image from storage
    try {
        const url = new URL(itemSrc);
        const path = url.pathname.split('/portfolio_images/')[1];
        if(path) {
            await supabase.storage.from('portfolio_images').remove([path]);
        }
    } catch(e) {
        console.error("Could not parse or delete image from storage:", e);
    }
    
    revalidatePath('/profile');
    revalidatePath('/provider/[providerId]', 'layout');
    return { error: null };
}
