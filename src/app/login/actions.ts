
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { SUPABASE_MASTER_PASSWORD } from '@/lib/server-config';

/**
 * Initiates the login process by generating, storing, and sending an OTP via a custom API route.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }
  
  const supabaseAdmin = createAdminClient();
  const normalizedPhone = normalizePhoneNumber(phone);
  const token = Math.floor(100000 + Math.random() * 900000).toString();

  // 1. Store the OTP in the database
  const { error: upsertError } = await supabaseAdmin
    .from('one_time_passwords')
    .upsert({ 
        phone: normalizedPhone, 
        token: token,
        created_at: new Date().toISOString()
    }, { onConflict: 'phone' });

  if (upsertError) {
    console.error('Error storing OTP:', upsertError);
    return { error: 'خطا در ذخیره‌سازی کد تایید. لطفاً دوباره تلاش کنید.' };
  }
  
  // 2. Call our internal API route to send the SMS
  // We need to construct the full URL for the fetch call on the server.
  const vercelUrl = process.env.VERCEL_URL;
  const baseUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:9004';
  
  const response = await fetch(`${baseUrl}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, token: token }),
  });
  
  const result = await response.json();

  if (!response.ok || result.error) {
      console.error('Error from /api/send-otp:', result.error);
      return { error: `خطا در ارسال کد تایید: ${result.error || 'مشکلی در سرویس پیامک رخ داد.'}` };
  }

  // 3. Redirect to verification page on success
  redirect(`/login/verify?phone=${phone}`);
}


/**
 * Verifies the OTP, creates a user if they don't exist, and creates a session.
 */
export async function verifyOtp(formData: FormData) {
    const phone = formData.get('phone') as string;
    const token = formData.get('pin') as string;

    if (!phone || !token) {
        return { error: 'شماره تلفن و کد تایید الزامی است.' };
    }

    const supabaseAdmin = createAdminClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: otpEntry, error: selectError } = await supabaseAdmin
        .from('one_time_passwords')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('token', token)
        .gt('created_at', fiveMinutesAgo)
        .single();
    
    if (selectError || !otpEntry) {
        return { error: 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' };
    }
    
    // Check if user exists in auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
        console.error("Supabase list users error:", listError);
        return { error: "خطا در بررسی اطلاعات کاربر." };
    }
    let existingUser = users.find(u => u.phone === normalizedPhone);
    let userFullName;

    if (!existingUser) {
        // Create user if they don't exist
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            phone: normalizedPhone,
            password: SUPABASE_MASTER_PASSWORD,
            phone_confirm: true,
        });

        if (createError || !createData?.user) {
            console.error('Supabase createUser error:', createError);
            return { error: `خطا در ایجاد حساب کاربری جدید: ${createError?.message}` };
        }
        existingUser = createData.user;
    }
    
    userFullName = existingUser.user_metadata?.full_name;
    
    // Sign the user in to create a session
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: SUPABASE_MASTER_PASSWORD,
    });

    if (sessionError) {
        console.error('Supabase Sign-In Error during OTP verify:', sessionError);
        return { error: `خطا در ورود به حساب کاربری: ${sessionError.message}`};
    }
    
    // Clean up the OTP
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
    
    // If the user is new (has no name/profile), redirect to complete registration. Otherwise, home.
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', existingUser.id).single();
    
    if (!profile) {
       redirect(`/register?phone=${phone}`);
     } else {
       redirect('/');
     }
}
