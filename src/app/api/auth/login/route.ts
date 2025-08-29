
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { normalizePhoneNumber } from '@/lib/utils';
import { getUserByPhone } from '@/lib/api';

export async function POST(request: Request) {
  const { phone } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: 'شماره تلفن الزامی است.' }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const supabaseAdmin = createAdminClient();

  try {
    // 1. Check if user exists. If not, they need to register.
    const user = await getUserByPhone(normalizedPhone);
    if (!user) {
        return NextResponse.json({ error: 'کاربری با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' }, { status: 404 });
    }

    // 2. Generate a magic link for the existing user.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        phone: normalizedPhone,
        options: {
            // This is where the user will be redirected after clicking the link
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
        }
    });

    if (error) {
      console.error('Error generating magic link:', error);
      throw new Error('خطا در ایجاد لینک ورود امن.');
    }
    
    // 3. In a real application, you would send this link via an SMS provider.
    // For this demo, we will log it to the server console.
    const magicLink = data.properties.action_link;
    console.log(`\n\n--- MAGIC LINK FOR ${normalizedPhone} ---\n${magicLink}\n--- CLICK THIS LINK TO LOG IN ---\n\n`);


    return NextResponse.json({ message: 'لینک ورود با موفقیت ایجاد و در کنسول سرور لاگ شد.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'یک خطای ناشناخته در سرور رخ داد.';
    console.error('Login API error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

