
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { categories, services as allServices } from '@/lib/constants';
import * as z from 'zod';
import { redirect } from 'next/navigation';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider']),
  name: z.string().min(2),
  phone: z.string().regex(/^(\+98|0)?9\d{9}$/),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
});


export async function registerUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  
  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'اطلاعات وارد شده نامعتبر است.' };
  }
  
  const { name, phone, accountType, serviceId, bio } = parsed.data;
  
  const supabaseAdmin = createAdminClient();
  const supabase = await createClient();

  // Get the currently logged-in user from the session created by OTP
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: 'جلسه کاربری شما معتبر نیست. لطفاً دوباره وارد شوید.' };
  }
  
  const normalizedPhone = normalizeForSupabaseAuth(phone);

  // Double-check that the phone number from the form matches the logged-in user
  if (session.user.phone !== normalizedPhone) {
      return { error: 'خطای امنیتی: شماره تلفن فرم با شماره تلفن کاربر وارد شده مطابقت ندارد.' };
  }

  const userId = session.user.id;

  // Check if a profile already exists for this user ID. This is the correct way
  // to prevent re-registration.
  const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

  if (existingProfile) {
    return { error: 'این کاربر قبلاً پروفایل خود را تکمیل کرده است.' };
  }
  
  // If registering as a provider, check for duplicate business name
  if (accountType === 'provider') {
    const { data: existingProviderByName } = await supabaseAdmin
      .from('providers')
      .select('id')
      .ilike('name', name)
      .single();

    if (existingProviderByName) {
      return { error: 'این نام کسب‌وکار قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.' };
    }
  }
  
  // 4. Update user metadata
   const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name, account_type: accountType },
    });
   if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        return { error: 'خطا در به‌روزرسانی اطلاعات کاربر.' };
   }


  // 5. Create profile in `profiles` table
  const { error: profileInsertError } = await supabaseAdmin
    .from('profiles')
    .insert({
        id: userId,
        full_name: name,
        phone: normalizedPhone,
        account_type: accountType,
    });

  if (profileInsertError) {
      console.error('Error inserting into profiles table:', profileInsertError);
      return { error: `خطای دیتابیس در ساخت پروفایل: ${profileInsertError.message}` };
  }


  // 6. If it's a provider, create an entry in the `providers` table
  if (accountType === 'provider') {
    if (!serviceId || !bio) {
        return { error: "برای هنرمندان، انتخاب نوع خدمات و نوشتن بیوگرافی الزامی است." };
    }
    const selectedCategory = categories.find(c => c.id.toString() === serviceId);
    const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

    const { error: providerInsertError } = await supabaseAdmin
        .from('providers')
        .insert({
            profile_id: userId,
            name: name,
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه',
            bio: bio,
            category_slug: selectedCategory?.slug,
            service_slug: firstServiceInCat?.slug,
            phone: normalizedPhone,
        });
    
    if (providerInsertError) {
      console.error('Error inserting into providers table:', providerInsertError);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      return { error: `خطا در ثبت اطلاعات هنرمند: ${providerInsertError.message}` };
    }
  }

  const destination = accountType === 'provider' ? '/profile' : '/';
  redirect(destination);
}
