'use server';

import { createClient } from '@/lib/supabase/server';
import { categories, services } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { redirect } from 'next/navigation';

type RegistrationFormValues = {
  name: string;
  accountType: 'customer' | 'provider';
  serviceType?: string; // category slug
  serviceSlug?: string; // specific service slug
  bio?: string;
  location?: string;
};

export async function verifyOtpAction(phone: string, token: string) {
    console.log(`[Action:verifyOtp] Attempting to verify OTP for phone: ${phone}`);
    const supabase = createClient();
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    const { data: { session }, error: authError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token,
        type: 'sms',
    });

    if (authError || !session) {
        console.error(`[Action:verifyOtp] OTP verification failed. Error: ${authError?.message}`);
        return { error: 'کد تایید نامعتبر است یا منقضی شده.', isNewUser: false, redirectPath: null };
    }
    
    console.log(`[Action:verifyOtp] OTP successful. User ID: ${session.user.id}`);
    
    // Now check if a profile exists
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, account_type')
        .eq('id', session.user.id)
        .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = "exact one row not found"
        console.error(`[Action:verifyOtp] Profile check failed: ${profileError.message}`);
        return { error: 'خطا در بررسی پروفایل: ' + profileError.message, isNewUser: false, redirectPath: null };
    }

    const isNewUser = !profile || !profile.full_name;
    console.log(`[Action:verifyOtp] Is new user? ${isNewUser}`);

    let redirectPath = '/';
    if(isNewUser) {
      redirectPath = `/login/verify?phone=${phone}`; // Stay on the same page to show registration form
    } else {
      if(profile.account_type === 'provider') {
        redirectPath = '/profile';
      }
    }
    
    console.log(`[Action:verifyOtp] Revalidating layout and setting redirect path to: ${redirectPath}`);
    revalidatePath('/', 'layout');
    return { error: null, isNewUser, redirectPath };
}


export async function completeRegistrationAction(values: RegistrationFormValues) {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'جلسه کاربری معتبر نیست. لطفاً دوباره وارد شوید.' };
  }

  const { user } = session;

  // Step 1: Create or update the main user profile.
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: values.name,
    phone: user.phone,
    account_type: values.accountType,
  }, { onConflict: 'id' }).select().single();

  if (profileError) {
    console.error('Error creating/updating profile:', profileError);
    return { error: 'خطا در ساخت/به‌روزرسانی پروفایل: ' + profileError.message };
  }

  // Step 2: If the user is a provider, create their provider-specific profile.
  if (values.accountType === 'provider') {
    if (!values.serviceType || !values.serviceSlug || !values.bio || !values.location) {
      return { error: 'اطلاعات هنرمند ناقص است. تمام فیلدها باید پر شوند.' };
    }
    const selectedService = services.find(s => s.slug === values.serviceSlug);

    // Use .insert() to create a new provider record linked to the profile.
    const { error: providerError } = await supabase.from('providers').insert({
      profile_id: user.id, // This is the crucial link to the profiles table.
      name: values.name,
      location: values.location,
      bio: values.bio,
      phone: user.phone!,
      service: selectedService?.name || 'خدمات عمومی',
      category_slug: values.serviceType,
      service_slug: values.serviceSlug,
      rating: 0,
      reviews_count: 0,
    });

    if (providerError) {
        console.error('Error creating provider profile:', providerError);
        return { error: 'خطا در ساخت پروفایل هنرمند: ' + providerError.message };
    }
  }

  revalidatePath('/', 'layout');
  revalidatePath('/profile', 'page');
  return { error: null };
}
