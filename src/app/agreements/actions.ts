
'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AgreementWithCustomer } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

// MODIFIED ACTION
export async function sendAgreementAction(providerProfileId: string) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'برای ارسال توافق باید وارد شوید.' };
    }

    // Insert into agreements table with 'pending' status
    const { error: insertError } = await supabase.from('agreements').insert({
        customer_id: user.id,
        provider_id: providerProfileId,
        status: 'pending', // Set initial status to pending
    });

    if (insertError) {
        if (insertError.code === '23505') {
            return { error: 'شما قبلاً یک درخواست توافق برای این هنرمند ارسال کرده‌اید.' };
        }
        console.error('Supabase agreement insert error:', insertError);
        return { error: 'خطا در ثبت درخواست توافق: ' + insertError.message };
    }

    // IMPORTANT: Do NOT increment the count here. It will be incremented upon acceptance.
    
    // Revalidate the provider's page to update the agreement button state.
    const { data: provider } = await supabase.from('providers').select('phone').eq('profile_id', providerProfileId).single();
    if (provider?.phone) {
        revalidatePath(`/provider/${provider.phone}`);
    }
    revalidatePath('/agreements'); // Revalidate agreements page for provider

    return { success: true };
}

// NEW ACTION
export async function acceptAgreementAction(agreementId: string, providerProfileId: string) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== providerProfileId) {
        return { error: 'شما مجاز به انجام این کار نیستید.' };
    }

    // 1. Update status to 'accepted'
    const { error: updateError } = await supabase
        .from('agreements')
        .update({ status: 'accepted' })
        .eq('id', agreementId);

    if (updateError) {
        return { error: 'خطا در تایید توافق: ' + updateError.message };
    }

    // 2. Increment the agreements_count on the providers table
    const { error: rpcError } = await supabase.rpc('increment_agreements', {
        provider_profile_id_in: providerProfileId,
    });

    if (rpcError) {
        console.error('Supabase increment_agreements RPC error after acceptance:', rpcError);
    }
    
    revalidatePath('/agreements');
    const { data: provider } = await supabase.from('providers').select('phone').eq('profile_id', providerProfileId).single();
    if (provider?.phone) {
        revalidatePath(`/provider/${provider.phone}`);
    }

    return { success: true };
}

// NEW ACTION
export async function rejectAgreementAction(agreementId: string, providerProfileId: string) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== providerProfileId) {
        return { error: 'شما مجاز به انجام این کار نیستید.' };
    }

    // Update status to 'rejected'
    const { error } = await supabase
        .from('agreements')
        .update({ status: 'rejected' })
        .eq('id', agreementId);

    if (error) {
        return { error: 'خطا در رد توافق: ' + error.message };
    }

    revalidatePath('/agreements');
    return { success: true };
}


// MODIFIED ACTION
export async function getAgreementsForProvider(): Promise<{ agreements: AgreementWithCustomer[], error: string | null }> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { agreements: [], error: 'هنرمند وارد نشده است.' };
    }

    // Fetch agreements and join with customer profiles, include status
    const { data, error } = await supabase
        .from('agreements')
        .select(`
            id,
            created_at,
            status,
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
    
    return { agreements: data as unknown as AgreementWithCustomer[], error: null };
}

// RENAMED and MODIFIED ACTION (was getUnseenAgreementsCount)
export async function getPendingAgreementsCount(): Promise<number> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 0;
    
    const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
    if(profile?.account_type !== 'provider') return 0;
    
    // Count only pending agreements
    const { count, error } = await supabase
        .from('agreements')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .eq('status', 'pending');
        
    if (error) {
        console.error("Error fetching pending agreements count:", error);
        return 0;
    }
    
    return count ?? 0;
}
