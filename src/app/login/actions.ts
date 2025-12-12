'use server';

import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Initiates the login process by generating an OTP, storing it, 
 * and then invoking a Supabase Edge Function to send the OTP via SMS.
 * This avoids direct server-to-Kavenegar connection issues.
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
  
  // 2. Invoke the Edge Function to send the SMS
  try {
    const { data, error: functionError } = await supabaseAdmin.functions.invoke('kavenegar-otp-sender', {
      body: { phone: normalizedPhone, token },
    });

    if (functionError) {
        console.error('Supabase function invocation error:', functionError);
        throw new Error('خطا در فراخوانی سرویس ارسال پیامک.');
    }

    if (data?.error) {
        console.error('Error from inside edge function:', data.error);
        throw new Error(data.error);
    }
    
  } catch (err: any) {
    console.error("Error in requestOtp invoking function:", err);
    return { error: err.message || "خطای ناشناخته در هنگام ارسال پیامک رخ داد." };
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

    if (!existingUser) {
        // Create user if they don't exist
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            phone: normalizedPhone,
            password: process.env.SUPABASE_MASTER_PASSWORD, // Use an env variable
            phone_confirm: true,
        });

        if (createError || !createData?.user) {
            console.error('Supabase createUser error:', createError);
            return { error: `خطا در ایجاد حساب کاربری جدید: ${createError?.message}` };
        }
        existingUser = createData.user;
    }
    
    // Sign the user in to create a session
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: process.env.SUPABASE_MASTER_PASSWORD!, // Use an env variable
    });

    if (sessionError) {
        console.error('Supabase Sign-In Error during OTP verify:', sessionError);
        return { error: `خطا در ورود به حساب کاربری: ${sessionError.message}`};
    }
    
    // Clean up the OTP
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
    
    // If the user is new (has no profile), redirect to complete registration. Otherwise, home.
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', existingUser.id).single();
    
    if (!profile) {
       redirect(`/register?phone=${phone}`);
     } else {
       redirect('/');
     }
}
