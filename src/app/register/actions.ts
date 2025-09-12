'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizePhoneNumber } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { categories, services } from '@/lib/constants';

export async function registerUser(formData: FormData) {
  const supabase = createClient();

  const rawFormData = {
    phone: formData.get('phone') as string,
    name: formData.get('name') as string,
    accountType: formData.get('accountType') as string,
    serviceType: formData.get('serviceType') as string,
    bio: formData.get('bio') as string,
  };

  // 1. Check if user with this phone number already exists
  const { data: existingUser, error: existingUserError } = await supabase.from('profiles').select('id').eq('phone', normalizePhoneNumber(rawFormData.phone)).single();
  
  if (existingUser) {
    return { error: 'این شماره تلفن قبلاً ثبت شده است. لطفاً وارد شوید.' };
  }

  // 2. Sign up the user with OTP
  const { data, error: signUpError } = await supabase.auth.signInWithOtp({
    phone: normalizePhoneNumber(rawFormData.phone),
    options: {
      // Store user metadata that will be available after they verify
      data: {
        full_name: rawFormData.name,
        account_type: rawFormData.accountType,
      },
    },
  });

  if (signUpError) {
    console.error('Sign-up error:', signUpError);
    return { error: `خطا در ثبت‌نام: ${signUpError.message}` };
  }
  
  const userId = data.user?.id;
  if (!userId) {
      return { error: 'کاربر پس از ثبت‌نام یافت نشد. لطفاً دوباره تلاش کنید.' };
  }

  // 3. Create a profile for the user
  const profileData: any = {
      id: userId,
      phone: normalizePhoneNumber(rawFormData.phone),
      full_name: rawFormData.name,
      account_type: rawFormData.accountType,
  };

  if (rawFormData.accountType === 'provider') {
      const selectedCategory = categories.find(c => c.slug === rawFormData.serviceType);
      const firstServiceInCat = services.find(s => s.categorySlug === selectedCategory?.slug);
      
      profileData.service = selectedCategory?.name || 'خدمت جدید';
      profileData.location = 'ارومیه'; // Default
      profileData.bio = rawFormData.bio;
      profileData.category_slug = selectedCategory?.slug || 'beauty';
      profileData.service_slug = firstServiceInCat?.slug || 'manicure-pedicure';
      profileData.rating = 0;
      profileData.reviews_count = 0;
  }

  const { error: profileError } = await supabase.from('profiles').insert(profileData);

  if (profileError) {
      console.error('Profile creation error:', profileError);
      // Attempt to delete the partially created user to allow them to try again
      await supabase.auth.admin.deleteUser(userId);
      return { error: `خطا در ساخت پروفایل: ${profileError.message}` };
  }


  // 4. Redirect to verification page
  redirect(`/login/verify?phone=${rawFormData.phone}`);
}
