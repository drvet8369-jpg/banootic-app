
'use server';

import { redirect } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export async function requestOtp(formData: FormData) {
  'use server';

  const phone = formData.get('phone') as string;

  try {
    const supabase = await createClient();
    const normalizedPhone = normalizeForSupabaseAuth(phone);

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      // این بخش حیاتی است: ما کل شیء خطا را به رشته تبدیل می کنیم
      // تا اطلاعات دقیق اشکال زدایی که از تابع دریافت می شود را ببینیم.
      const detailedError = `Supabase signInWithOtp Error: ${JSON.stringify(error, null, 2)}`;
      console.error(detailedError);
      return { error: detailedError };
    }
  } catch (e: any) {
    console.error('Critical error in requestOtp action:', e);
    return { error: `A critical error occurred: ${e.message}` };
  }

  // در صورت درخواست موفقیت آمیز OTP، به صفحه تایید هدایت شوید.
  redirect(`/login/verify?phone=${phone}`);
}


export async function verifyOtp(formData: FormData) {
  'use server';
  
  const phone = formData.get('phone') as string;
  const pin = formData.get('pin') as string;
  
  if (!phone || !pin) {
    return { error: "شماره تلفن و کد تایید الزامی است." };
  }

  const supabase = await createClient();
  const normalizedPhone = normalizeForSupabaseAuth(phone);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: pin,
    type: 'sms',
  });

  if (error) {
    console.error("Supabase verifyOtp Error:", error);
    return { error: `کد تایید نامعتبر است: ${error.message}` };
  }

  // بررسی کنید که آیا پروفایلی برای این کاربر وجود دارد یا خیر.
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, account_type')
      .eq('id', data.user.id)
      .single();

    // اگر پروفایل وجود دارد و کامل است، به صفحه مناسب هدایت شوید.
    if (profile?.full_name) {
       redirect(profile.account_type === 'provider' ? '/profile' : '/');
    }
  }
  
  // اگر پروفایلی وجود ندارد، یا ناقص است، به صفحه تکمیل ثبت نام هدایت شوید.
  redirect(`/register?phone=${phone}`);
}
