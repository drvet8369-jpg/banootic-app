'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { AgreementWithProviderDetails } from '@/lib/types';

export async function getCustomerAgreements(): Promise<{ agreements: AgreementWithProviderDetails[], error: string | null }> {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { agreements: [], error: 'کاربر وارد نشده است.' };
    }

    // This query fetches agreements for the current customer.
    // It uses a specific foreign key relationship to join with profiles of the providers,
    // and then a nested join to get details from the providers table.
    // This avoids the ambiguity error we previously encountered.
    const { data, error } = await supabase
        .from('agreements')
        .select(`
            id,
            status,
            created_at,
            provider_profile:profiles!agreements_provider_id_fkey (
                id,
                providers (
                    name,
                    phone
                ),
                profile_image_url
            )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching customer agreements:', error);
        return { agreements: [], error: `خطا در واکشی داده‌ها: ${error.message}` };
    }

    return { agreements: data as AgreementWithProviderDetails[], error: null };
}
