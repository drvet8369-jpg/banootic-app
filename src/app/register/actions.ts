'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { services } from '@/lib/constants';

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

    // --- RESILIENT SERVICE LOOKUP ---
    // This logic makes the process resilient to an unseeded `services` table.
    
    // First, find the service name from our reliable constants file.
    const serviceFromConst = services.find(s => s.slug === values.serviceSlug);
    const serviceNameToSet = serviceFromConst ? serviceFromConst.name : 'خدمات عمومی';

    // Next, try to find the corresponding service in the database to get its real ID.
    const { data: selectedServiceFromDB, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('slug', values.serviceSlug)
      .single();
      
    let serviceIdToSet = null;
    if (serviceError && serviceError.code !== 'PGRST116') {
        // An actual error occurred, other than 'not found'.
        console.error('Unexpected error fetching service by slug:', serviceError);
        // We can still proceed, but without the service_id link.
    } else if (selectedServiceFromDB) {
        // Success! We found the service in the DB.
        serviceIdToSet = selectedServiceFromDB.id;
    } else {
        // The service was not found in the DB (PGRST116 error). This is expected if the table is not seeded.
        // We will proceed with serviceIdToSet as null.
        console.warn(`Service with slug "${values.serviceSlug}" not found in the database. This is expected if the 'services' table has not been seeded. Continuing without the foreign key link.`);
    }

    // Step 1: Update the user's account_type in the profiles table.
    // This will now work even if serviceIdToSet is null.
    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
            account_type: 'provider',
            service_id: serviceIdToSet,
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
        service: serviceNameToSet, // Use the name from the constants file
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
