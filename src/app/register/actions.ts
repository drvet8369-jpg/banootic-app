
'use server';

import { createClient } from '@/lib/supabase/server';
import { categories, services as allServices } from '@/lib/constants';
import * as z from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider']),
  name: z.string().min(2),
  phone: z.string().regex(/^(09|\+989)\d{9}$/),
  location: z.string().optional(),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
});

// The function now returns an error object or nothing (on success, it redirects).
export async function registerUser(formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const cookieStore = cookies();
  
  // --- Start of Precise Debugging ---
  const allCookies = cookieStore.getAll();
  const supabaseCookieFound = allCookies.some(cookie => cookie.name.startsWith('sb-'));

  if (!supabaseCookieFound) {
      return { error: 'خطای اشکال‌زدایی: کوکی جلسه Supabase (که با sb- شروع می‌شود) به سرور نرسید. لطفاً یکبار دیگر فرآیند ورود را از ابتدا انجام دهید.' };
  }
  // --- End of Precise Debugging ---

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        // This error will now only trigger if the cookie exists but Supabase can't validate it.
        const allCookieDetails = JSON.stringify(allCookies, null, 2);
        return { error: `خطای حیاتی: کوکی جلسه به سرور رسید اما Supabase نتوانست آن را تایید کند. جزئیات کوکی: ${allCookieDetails}` };
    }

    const userId = session.user.id;
    const values = Object.fromEntries(formData.entries());
    const parsed = formSchema.safeParse(values);
    
    if (!parsed.success) {
      console.error("Form parsing failed", parsed.error);
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
        console.error('Error upserting into profiles table:', profileInsertError);
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
        console.error('Error upserting into providers table:', providerInsertError);
        return { error: `خطا در ثبت اطلاعات هنرمند: ${providerInsertError.message}` };
      }
    }
  } catch (e: any) {
    console.error('A critical error occurred in registerUser action:', e);
    return { error: `یک خطای پیش‌بینی نشده در سرور رخ داد: ${e.message}` };
  }

  const destination = formData.get('accountType') === 'provider' ? '/profile' : '/';
  revalidatePath('/', 'layout');
  
  // On success, redirect instead of returning a value.
  redirect(destination);
}

