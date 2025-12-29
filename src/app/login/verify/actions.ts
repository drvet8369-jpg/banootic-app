
'use server';

import { createClient } from '@/lib/supabase/server';
import { categories } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { logToFile } from '@/lib/logger';

type RegistrationFormValues = {
  name: string;
  accountType: 'customer' | 'provider';
  serviceType?: string;
  bio?: string;
  location?: string;
};

export async function verifyOtpAction(phone: string, token: string) {
    await logToFile(`verifyOtpAction: Started for phone: ${phone}`);
    const supabase = createClient();
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    const { data: { session }, error: authError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token,
        type: 'sms',
    });

    if (authError || !session) {
        await logToFile(`verifyOtpAction: OTP verification failed. Error: ${authError?.message}`);
        return { error: 'کد تایید نامعتبر است یا منقضی شده.', isNewUser: false, redirectPath: null };
    }
    
    await logToFile(`verifyOtpAction: OTP successful for user ID: ${session.user.id}`);
    
    // Now check if a profile exists
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', session.user.id)
        .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = "exact one row not found"
        await logToFile(`verifyOtpAction: DB error checking profile. Error: ${profileError.message}`);
        return { error: 'خطا در بررسی پروفایل: ' + profileError.message, isNewUser: false, redirectPath: null };
    }

    const isNewUser = !profile || !profile.full_name;
    await logToFile(`verifyOtpAction: Profile check complete. isNewUser = ${isNewUser}. Profile found: ${JSON.stringify(profile)}`);

    let redirectPath = '/';
    if(isNewUser) {
      redirectPath = `/login/verify?phone=${phone}`; // Stay on the same page to show registration form
    } else {
      const {data: providerProfile} = await supabase.from('providers').select('id').eq('profile_id', session.user.id).single();
      if(providerProfile) {
        redirectPath = '/profile';
      }
    }
    
    await logToFile(`verifyOtpAction: Decision complete. Redirecting to: ${redirectPath}`);
    revalidatePath('/', 'layout');
    return { error: null, isNewUser, redirectPath };
}


export async function completeRegistrationAction(values: RegistrationFormValues) {
  await logToFile(`completeRegistrationAction: Started for user: ${values.name}`);
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await logToFile(`completeRegistrationAction: Failed. No valid session found.`);
    return { error: 'جلسه کاربری معتبر نیست. لطفاً دوباره وارد شوید.' };
  }
  await logToFile(`completeRegistrationAction: Session valid for user ID: ${session.user.id}`);

  const { user } = session;

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: values.name,
    phone: user.phone,
    account_type: values.accountType,
  });

  if (profileError) {
    await logToFile(`completeRegistrationAction: Failed to upsert profile. Error: ${profileError.message}`);
    return { error: 'خطا در ساخت/به‌روزرسانی پروفایل: ' + profileError.message };
  }
  await logToFile(`completeRegistrationAction: Profile upserted successfully for user: ${values.name}`);

  if (values.accountType === 'provider') {
    if (!values.serviceType || !values.bio || !values.location) {
      await logToFile(`completeRegistrationAction: Provider registration failed. Missing fields.`);
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
      await logToFile(`completeRegistrationAction: Failed to upsert provider. Error: ${providerError.message}`);
      return { error: 'خطا در ساخت پروفایل هنرمند: ' + providerError.message };
    }
    await logToFile(`completeRegistrationAction: Provider profile upserted successfully.`);
  }

  revalidatePath('/', 'layout');
  return { error: null };
}
