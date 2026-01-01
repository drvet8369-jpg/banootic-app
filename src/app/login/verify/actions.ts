
'use server';

import { createClient } from '@/lib/supabase/server';
import { categories } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { normalizeForSupabaseAuth } from '@/lib/utils';

type RegistrationFormValues = {
  name: string;
  accountType: 'customer' | 'provider';
  serviceType?: string;
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
        .select('id, full_name')
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
      const {data: providerProfile} = await supabase.from('providers').select('id').eq('profile_id', session.user.id).single();
      if(providerProfile) {
        redirectPath = '/profile';
      }
    }
    
    console.log(`[Action:verifyOtp] Revalidating layout and redirecting to: ${redirectPath}`);
    // Revalidate all relevant paths after successful login
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

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: values.name,
    phone: user.phone,
    account_type: values.accountType,
  });

  if (profileError) {
    return { error: 'خطا در ساخت/به‌روزرسانی پروفایل: ' + profileError.message };
  }

  if (values.accountType === 'provider') {
    if (!values.serviceType || !values.bio || !values.location) {
      return { error: 'اطلاعات هنرمند ناقص است.' };
    }
    const category = categories.find(c => c.slug === values.serviceType);

    const { error: providerError } = await supabase.from('providers').upsert({
      profile_id: user.id,
      name: values.name,
      location: values.location,
      bio: values.bio,
      phone: user.phone!,
      service: category?.name || 'خدمات عمومی',
      category_slug: values.serviceType,
      rating: 0,
      reviews_count: 0,
    }, { onConflict: 'profile_id' });

    if (providerError) {
      return { error: 'خطا در ساخت پروفایل هنرمند: ' + providerError.message };
    }
  }

  // Revalidate all relevant paths after registration
  revalidatePath('/', 'layout');
  revalidatePath('/profile', 'page');
  return { error: null };
}
