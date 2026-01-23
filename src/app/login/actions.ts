'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function requestOtp(formData: FormData) {
  'use server';

  const phone = formData.get('phone') as string;

  try {
    const supabase = createClient();
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      // **تغییر کلیدی:** به طور خاص خطای تایم‌اوت را بررسی می‌کنیم
      if (error.message.includes('Failed to reach hook within maximum time')) {
        return { error: 'سرویس ارسال پیامک در حال حاضر کند است. لطفاً یک بار دیگر تلاش کنید.' };
      }
      
      // برای هر خطای دیگری از Supabase، پیام فنی را نمایش می‌دهیم
      const detailedError = `Supabase signInWithOtp Error: ${error.message}`;
      console.error(detailedError);
      return { error: detailedError };
    }
  } catch (e: any) {
    // این قسمت خطاهای دیگر مانند مشکل در نرمال‌سازی شماره را مدیریت می‌کند
    console.error('Critical error in requestOtp action:', e);
    return { error: `یک خطای پیش‌بینی نشده رخ داد: ${e.message}` };
  }

  // در صورت موفقیت، به صفحه تایید هدایت می‌شود
  revalidatePath('/login/verify');
  redirect(`/login/verify?phone=${phone}`);
}
