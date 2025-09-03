'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { normalizePhoneNumber } from '@/lib/utils';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const phoneSchema = z.string().regex(/^09\d{9}$/, {
  message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
});

const verifySchema = z.object({
  phone: phoneSchema,
  token: z.string().min(6, { message: 'کد تایید باید ۶ رقم باشد.' }),
});

const registerSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2, { message: 'نام باید حداقل ۲ حرف داشته باشد.' }),
  accountType: z.enum(['customer', 'provider']),
  serviceType: z.string().optional(),
  serviceSlug: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
});

export async function requestOtp(prevState: any, formData: FormData) {
  const supabase = await createActionClient();
  const phone = formData.get('phone') as string;

  const validation = phoneSchema.safeParse(phone);
  if (!validation.success) {
    return {
      message: validation.error.errors[0].message,
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  });

  if (error) {
    console.error('OTP Error:', error);
    return {
      message: 'خطا در ارسال کد تایید. لطفاً شماره را بررسی کرده و دوباره تلاش کنید.',
    };
  }

  redirect(`/auth/verify?phone=${encodeURIComponent(phone)}`);
}

export async function verifyOtp(prevState: any, formData: FormData) {
  const supabase = await createActionClient();
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;

  const validation = verifySchema.safeParse({ phone, token });

  if (!validation.success) {
    return {
      message: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: token,
    type: 'sms',
  });

  if (error) {
    console.error('Verify OTP Error:', error);
    return {
      message: 'کد تایید نامعتبر است یا منقضی شده.',
    };
  }

  if (session) {
    // Check if the user exists in our public users table
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (!userProfile) {
      // New user, redirect to complete registration
      redirect(`/auth/register?phone=${encodeURIComponent(phone)}`);
    } else {
      // Existing user, redirect to home
      redirect('/');
    }
  }

  return { message: 'خطای غیرمنتظره در تایید کد.' };
}

export async function completeRegistration(prevState: any, formData: FormData) {
  const supabase = await createActionClient();

  const rawData = Object.fromEntries(formData.entries());
  const validation = registerSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      message: validation.error.errors.map((e) => e.message).join(', '),
    };
  }
  const { name, phone, accountType, serviceType, serviceSlug, bio, location } = validation.data;

  // 1. Get the currently authenticated user from the OTP session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { message: 'کاربر احراز هویت نشده است. لطفاً دوباره تلاش کنید.' };
  }
  
  // 2. Update user's metadata in the auth schema
  const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        name,
        account_type: accountType,
        phone,
      }
  });

  if (metadataError) {
      console.error("Metadata update error:", metadataError);
      return { message: 'خطا در به‌روزرسانی اطلاعات کاربر.'};
  }

  // 3. Create a profile in the public `users` table
  const { error: userProfileError } = await supabase
    .from('users')
    .insert({
        id: user.id,
        name: name,
        phone: phone,
        account_type: accountType,
    });
    
  if (userProfileError) {
      console.error("User profile insert error:", userProfileError);
      return { message: 'خطا در ساخت پروفایل عمومی کاربر.' };
  }

  // 4. If the user is a provider, create an entry in the `providers` table
  if (accountType === 'provider') {
    const { error: providerError } = await supabase
      .from('providers')
      .insert({
        user_id: user.id,
        name: name,
        phone: phone,
        service: serviceType, // This should be the full name from `services` constant
        bio: bio,
        category_slug: serviceType, // This seems incorrect, should be category slug
        service_slug: serviceSlug,
        location: location || 'ارومیه',
        // Default values
        rating: 0,
        reviews_count: 0,
        portfolio: [],
        profile_image: { src: '', ai_hint: 'woman portrait' }
      });

    if (providerError) {
      console.error("Provider insert error:", providerError);
      return { message: 'خطا در ساخت پروفایل هنرمند.'};
    }
  }

  redirect('/');
}
