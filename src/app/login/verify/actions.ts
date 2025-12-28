
'use server';

import { createClient } from '@/lib/supabase/server';
import { categories } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

// This type must match the one in the client form
type RegistrationFormValues = {
  name: string;
  accountType: 'customer' | 'provider';
  serviceType?: string;
  bio?: string;
  location?: string;
};

export async function completeRegistrationAction(values: RegistrationFormValues) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'جلسه کاربری معتبر نیست. لطفاً دوباره وارد شوید.', redirectPath: '/login' };
  }

  const { user } = session;

  // 1. Insert into 'profiles' table
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: values.name,
    phone: user.phone, // Phone comes from the authenticated user session
    account_type: values.accountType,
  });

  if (profileError) {
    // This could happen if the user refreshes and tries to submit again.
    // We can check if it's a unique constraint violation.
    if (profileError.code === '23505') { // unique_violation
        console.warn(`Profile for user ${user.id} already exists. Proceeding...`);
    } else {
        console.error('Error creating profile:', profileError);
        return { error: 'خطا در ساخت پروفایل: ' + profileError.message, redirectPath: null };
    }
  }

  // 2. If user is a provider, insert into 'providers' table
  let redirectPath = '/';
  if (values.accountType === 'provider') {
    if (!values.serviceType || !values.bio || !values.location) {
        return { error: 'اطلاعات هنرمند ناقص است.', redirectPath: null };
    }
    const category = categories.find(c => c.slug === values.serviceType);

    const { error: providerError } = await supabase.from('providers').insert({
      profile_id: user.id,
      name: values.name,
      location: values.location,
      bio: values.bio,
      phone: user.phone!,
      service: category?.name || 'خدمات عمومی', // The general service name
      category_slug: values.serviceType,
      // You can add default values for other provider fields here
      rating: 0,
      reviews_count: 0,
    });

    if (providerError) {
      console.error('Error creating provider profile:', providerError);
      return { error: 'خطا در ساخت پروفایل هنرمند: ' + providerError.message, redirectPath: null };
    }
    redirectPath = '/profile'; // Redirect providers to their profile
  }
  
  // Revalidate the root path to reflect the new login state in the header
  revalidatePath('/', 'layout');

  return { error: null, redirectPath };
}
