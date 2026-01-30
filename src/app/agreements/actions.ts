
'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AgreementWithCustomer } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

export async function sendAgreementAction(providerProfileId: string) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'برای ارسال توافق باید وارد شوید.' };
    }

    // Insert into agreements table
    const { error: insertError } = await supabase.from('agreements').insert({
        customer_id: user.id,
        provider_id: providerProfileId,
    });

    if (insertError) {
        // Handle unique constraint violation gracefully
        if (insertError.code === '23505') {
            return { error: 'شما قبلاً با این هنرمند توافق کرده‌اید.' };
        }
        console.error('Supabase agreement insert error:', insertError);
        return { error: 'خطا در ثبت توافق: ' + insertError.message };
    }

    // Increment the agreements_count on the providers table
    const { error: rpcError } = await supabase.rpc('increment_agreements', {
        provider_profile_id_in: providerProfileId,
    });

    if (rpcError) {
        // This is not a fatal error for the user, so we'll just log it.
        // The agreement is saved, but the count might be out of sync.
        console.error('Supabase increment_agreements RPC error:', rpcError);
    }
    
    // Fetch provider phone to revalidate path
    const { data: provider } = await supabase.from('providers').select('phone').eq('profile_id', providerProfileId).single();

    if (provider?.phone) {
        revalidatePath(`/provider/${provider.phone}`);
    }

    return { success: true };
}


export async function getAgreementsForProvider(): Promise<{ agreements: AgreementWithCustomer[], error: string | null }> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { agreements: [], error: 'هنرمند وارد نشده است.' };
    }

    // Fetch agreements and join with customer profiles
    const { data, error } = await supabase
        .from('agreements')
        .select(`
            id,
            created_at,
            customer:profiles!agreements_customer_id_fkey (
                full_name,
                profile_image_url
            )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements:', error);
        return { agreements: [], error: error.message };
    }
    
    // Mark these agreements as seen in a separate, non-blocking call
    const unseenAgreementIds = data
        .filter(a => !(a as any).is_seen_by_provider)
        .map(a => a.id);
        
    if (unseenAgreementIds.length > 0) {
        await supabase
            .from('agreements')
            .update({ is_seen_by_provider: true })
            .in('id', unseenAgreementIds);
    }

    // The data structure from Supabase with the join is already close to what we need
    return { agreements: data as unknown as AgreementWithCustomer[], error: null };
}

export async function getUnseenAgreementsCount(): Promise<number> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 0;
    
    const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
    if(profile?.account_type !== 'provider') return 0;
    
    const { count, error } = await supabase
        .from('agreements')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .eq('is_seen_by_provider', false);
        
    if (error) {
        console.error("Error fetching unseen agreements count:", error);
        return 0;
    }
    
    return count ?? 0;
}
