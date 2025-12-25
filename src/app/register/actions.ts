
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
  console.log("DEBUG: Register User Server Action Executing...");
  
  const supabase = await createClient();

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // --- START DEBUG LOGGING ---
    console.log("DEBUG: Supabase getSession() result in server action:");
    console.log("DEBUG: Session object:", JSON.stringify(session, null, 2));
    console.log("DEBUG: Error object:", JSON.stringify(sessionError, null, 2));
    // --- END DEBUG LOGGING ---

    if (sessionError) {
        console.error('DEBUG: Supabase getSession Error in Action:', sessionError);
        return { error: `خطا در دریافت جلسه از سرور: ${sessionError.message}` };
    }

    if (!session?.user) {
        console.log('DEBUG: No active session found on server action.');
        return { error: 'خطای حیاتی: سرور نتوانست هویت شما را از کوکی جلسه بخواند. لطفاً یک بار دیگر از صفحه ورود تلاش کنید.' };
    }

    const userId = session.user.id;
    console.log(`DEBUG: User ID found from session: ${userId}`);
    
    const values = Object.fromEntries(formData.entries());
    const parsed = formSchema.safeParse(values);
    
    if (!parsed.success) {
      console.error("DEBUG: Form parsing failed", parsed.error);
      return { error: 'اطلاعات وارد شده در فرم نامعتبر است.' };
    }
    
    const { name, accountType, location, serviceId, bio } = parsed.data;
    
    const userPhone = session.user.phone;
    if (!userPhone) {
        return { error: 'شماره تلفن کاربر در جلسه یافت نشد.'};
    }

    const { error: profileInsertError } = await supabase
      .from('profiles')
      .upsert({
          id: userId,
          full_name: name,
          phone: userPhone,
          account_type: accountType,
      }, { onConflict: 'id' });

    if (profileInsertError) { 
        console.error('DEBUG: Error upserting into profiles table:', profileInsertError);
        return { error: `خطای دیتابیس در ساخت پروفایل: ${profileInsertError.message}` };
    }
    console.log(`DEBUG: Profile for user ${userId} upserted successfully.`);


    if (accountType === 'provider') {
      if (!serviceId || !bio || !location) {
          return { error: "برای هنرمندان، انتخاب شهر، نوع خدمات و نوشتن بیوگرافی الزامی است." };
      }
      const selectedCategory = categories.find(c => c.id.toString() === serviceId);
      const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

      const { error: providerInsertError } = await supabase
          .from('providers')
          .upsert({
              profile_id: userId,
              name: name,
              service: selectedCategory?.name || 'خدمت جدید',
              location: location,
              bio: bio,
              category_slug: selectedCategory?.slug,
              service_slug: firstServiceInCat?.slug,
              phone: userPhone,
          }, { onConflict: 'profile_id' });
      
      if (providerInsertError) {
        console.error('DEBUG: Error upserting into providers table:', providerInsertError);
        return { error: `خطا در ثبت اطلاعات هنرمند: ${providerInsertError.message}` };
      }
      console.log(`DEBUG: Provider data for user ${userId} upserted successfully.`);
    }
  } catch (e: any) {
    console.error('DEBUG: A critical error occurred in registerUser action:', e);
    return { error: `یک خطای پیش‌بینی نشده در سرور رخ داد: ${e.message}` };
  }

  const destination = formData.get('accountType') === 'provider' ? '/profile' : '/';
  revalidatePath('/', 'layout');
  
  // Instead of returning success, we directly redirect here.
  // This is a more robust pattern after a successful form action.
  redirect(destination);
}
