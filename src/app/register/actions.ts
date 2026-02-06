'use server';

import { createClient } from '@/lib/supabase/server';
import { services } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type UpgradeFormValues = {
  serviceType: string;
  serviceSlug: string;
  bio: string;
  location: string;
};

export async function upgradeCustomerToProviderAction(values: UpgradeFormValues) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'کاربر وارد نشده است. لطفا دوباره وارد شوید.' };
    }
    
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (profileError || !profile) {
        return { error: 'پروفایل کاربری شما یافت نشد.'};
    }
    
    if (profile.account_type === 'provider') {
        return { error: 'حساب شما در حال حاضر یک حساب هنرمند است.' };
    }

    const selectedService = services.find(s => s.slug === values.serviceSlug);
    if (!selectedService) {
        return { error: 'خدمت انتخاب شده معتبر نیست.' };
    }

    // Step 1: Update the user's account_type in the profiles table
    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
            account_type: 'provider',
            service_id: selectedService.id,
        })
        .eq('id', user.id);

    if (updateProfileError) {
        console.error('Error upgrading account type:', updateProfileError);
        return { error: 'خطا در ارتقاء نوع حساب: ' + updateProfileError.message };
    }

    // Step 2: Insert a new record into the providers table
    const { error: providerInsertError } = await supabase.from('providers').insert({
        profile_id: user.id,
        name: profile.full_name!,
        location: values.location,
        bio: values.bio,
        phone: profile.phone!,
        service: selectedService.name,
        category_slug: values.serviceType,
        service_slug: values.serviceSlug,
        rating: 0,
        reviews_count: 0,
    });

    if (providerInsertError) {
        console.error('Error creating provider profile:', providerInsertError);
        // Attempt to roll back the account type change
        await supabase.from('profiles').update({ account_type: 'customer', service_id: null }).eq('id', user.id);
        return { error: 'خطا در ساخت پروفایل هنرمند: ' + providerInsertError.message };
    }
    
    revalidatePath('/', 'layout'); // Revalidate everything to update header, etc.
    // The client will redirect to /profile on success
    return { error: null };
}
