'use server';

import { createClient } from '@/lib/supabase/server';
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

    // Fetch the correct service ID and name from the database using the slug
    const { data: selectedService, error: serviceError } = await supabase
      .from('services')
      .select('id, name')
      .eq('slug', values.serviceSlug)
      .single();

    if (serviceError || !selectedService) {
        console.error('Error fetching service by slug:', serviceError);
        return { error: 'خدمت انتخاب شده در پایگاه داده یافت نشد.' };
    }


    // Step 1: Update the user's account_type in the profiles table with the correct ID
    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
            account_type: 'provider',
            service_id: selectedService.id, // Use the correct ID from DB
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
        service: selectedService.name, // Use the correct name from DB
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
