'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormValues } from './register-form';

export async function completeRegisterAction(values: FormValues) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'کاربر وارد نشده است' };
  }

  const { user } = session;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    full_name: values.name,
    phone: values.phone,
    account_type: values.accountType,
  });

  if (profileError) {
    return { error: 'خطا در ساخت پروفایل: ' + profileError.message };
  }

  if (values.accountType === 'provider') {
    const { error: providerError } = await supabase.from('providers').insert({
      profile_id: user.id,
      name: values.name,
      location: values.location,
      bio: values.bio,
      phone: values.phone,
      // You might want to add default values for other provider fields here
      // For example: service, category_slug, etc.
    });

    if (providerError) {
      return { error: 'خطا در ساخت پروفایل هنرمند: ' + providerError.message };
    }
  }

  return { error: null };
}
