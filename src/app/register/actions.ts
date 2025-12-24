
'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { categories, services as allServices } from '@/lib/constants';
import * as z from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider']),
  name: z.string().min(2),
  phone: z.string().regex(/^(09|\+989)\d{9}$/),
  location: z.string().optional(),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
});

export async function registerUser(prevState: any, formData: FormData) {
  console.log("Register User Server Action Executing...");
  
  // The Supabase client must be awaited.
  const supabase = await createClient();

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Supabase getSession Error in Action:', sessionError);
        return { error: `خطا در دریافت جلسه از سرور: ${sessionError.message}` };
    }

    if (!session?.user) {
        console.log('No active session found on server action.');
        console.log(`محتوای جلسه روی سرور: ${JSON.stringify(session)}`);
        return { error: `جلسه کاربری معتبر یافت نشد. محتوای جلسه روی سرور: ${JSON.stringify(session)}` };
    }

    const userId = session.user.id;
    
    const values = Object.fromEntries(formData.entries());
    const parsed = formSchema.safeParse(values);
    
    if (!parsed.success) {
      console.error("Form parsing failed", parsed.error);
      return { error: 'اطلاعات وارد شده نامعتبر است.' };
    }
    
    const { name, accountType, location, serviceId, bio } = parsed.data;
    
    // We already have the user's phone from the session, which is more secure.
    const userPhone = session.user.phone;
    if (!userPhone) {
        return { error: 'شماره تلفن کاربر در جلسه یافت نشد.'};
    }

    // We no longer need the admin client for this part, as we are operating as the user.
    // However, for checks and inserts, it's safer to use the admin client to bypass RLS if needed.
    // For now, let's assume RLS is set up to allow users to edit their own profiles.
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
          id: userId,
          full_name: name,
          phone: userPhone,
          account_type: accountType,
      });

    if (profileInsertError && profileInsertError.code !== '23505') { // Ignore if profile already exists
        console.error('Error inserting into profiles table:', profileInsertError);
        return { error: `خطای دیتابیس در ساخت پروفایل: ${profileInsertError.message}` };
    }


    if (accountType === 'provider') {
      if (!serviceId || !bio || !location) {
          return { error: "برای هنرمندان، انتخاب شهر، نوع خدمات و نوشتن بیوگرافی الزامی است." };
      }
      const selectedCategory = categories.find(c => c.id.toString() === serviceId);
      const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

      const { error: providerInsertError } = await supabase
          .from('providers')
          .insert({
              profile_id: userId,
              name: name,
              service: selectedCategory?.name || 'خدمت جدید',
              location: location,
              bio: bio,
              category_slug: selectedCategory?.slug,
              service_slug: firstServiceInCat?.slug,
              phone: userPhone,
          });
      
      if (providerInsertError) {
        console.error('Error inserting into providers table:', providerInsertError);
        // Attempt to roll back profile insert if provider insert fails
        await supabase.from('profiles').delete().eq('id', userId);
        return { error: `خطا در ثبت اطلاعات هنرمند: ${providerInsertError.message}` };
      }
    }
  } catch (e: any) {
    console.error('A critical error occurred in registerUser action:', e);
    return { error: `یک خطای پیش‌بینی نشده در سرور رخ داد: ${e.message}` };
  }

  const destination = formData.get('accountType') === 'provider' ? '/profile' : '/';
  revalidatePath('/', 'layout');
  return { success: true, destination };
}
