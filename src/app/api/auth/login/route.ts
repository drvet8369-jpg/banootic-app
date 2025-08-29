
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { normalizePhoneNumber } from '@/lib/utils';
import { getUserByPhone } from '@/lib/api';

// This API route starts the OTP login process.
// In a real app with an SMS provider configured, Supabase would send the OTP.
// In our development setup, Supabase will not send an SMS but will prepare the OTP
// for verification. We will rely on the client-side call for this process.

export async function POST(request: Request) {
  const { phone } = await request.json();

  if (!phone) {
    return NextResponse.json({ error: 'شماره تلفن الزامی است.' }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  
  try {
    // We just need to check if the user exists. The client will handle the OTP logic.
    const user = await getUserByPhone(normalizedPhone);
    if (!user) {
        return NextResponse.json({ error: 'کاربری با این شماره تلفن یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' }, { status: 404 });
    }

    // The actual `signInWithOtp` will be called on the client side,
    // which is the standard Supabase flow. This API route now only serves
    // to confirm the user's existence before initiating the client-side flow.
    return NextResponse.json({ message: 'کاربر یافت شد. لطفاً برای دریافت کد OTP ادامه دهید.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'یک خطای ناشناخته در سرور رخ داد.';
    console.error('Login API (user check) error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
