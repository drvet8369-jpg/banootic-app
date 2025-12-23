
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
  phone: z.string().regex(/^(09|\+989)\d{9}$/),
  location: z.string().optional(),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
});


export async function registerUser(formData: FormData) {
  const supabase = await createClient();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
      console.error('Supabase getSession Error:', sessionError);
      return { error: `خطا در دریافت جلسه از سرور: ${sessionError.message}` };
  }

  if (!session?.user) {
      console.log('No active session found on server action.');
      return { error: `جلسه کاربری معتبر یافت نشد. محتوای جلسه روی سرور: ${JSON.stringify(session)}` };
  }

  const userId = session.user.id;


    const values = Object.fromEntries(formData.entries());
    
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      return { error: 'اطلاعات وارد شده نامعتبر است.' };
    }
    
    const { name, phone, accountType, location, serviceId, bio } = parsed.data;
    
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    // Double-check that the phone number from the form matches the logged-in user
    if (session.user.phone !== normalizedPhone) {
        return { error: 'خطای امنیتی: شماره تلفن فرم با شماره تلفن کاربر وارد شده مطابقت ندارد.' };
    }

    const supabaseAdmin = createAdminClient();

    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (existingProfile) {
      return { error: 'این کاربر قبلاً پروفایل خود را تکمیل کرده است.' };
    }
    
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
    
     const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: name, account_type: accountType },
      });
     if (metadataError) {
          console.error('Error updating user metadata:', metadataError);
          return { error: 'خطا در به‌روزرسانی اطلاعات کاربر.' };
     }


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


    if (accountType === 'provider') {
      if (!serviceId || !bio || !location) {
          return { error: "برای هنرمندان، انتخاب شهر، نوع خدمات و نوشتن بیوگرافی الزامی است." };
      }
      const selectedCategory = categories.find(c => c.id.toString() === serviceId);
      const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

      const { error: providerInsertError } = await supabaseAdmin
          .from('providers')
          .insert({
              profile_id: userId,
              name: name,
              service: selectedCategory?.name || 'خدمت جدید',
              location: location,
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
