'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { KAVEHNEGAR_API_KEY, SUPABASE_MASTER_PASSWORD } from '@/lib/server-config';
import fetch from 'node-fetch';


/**
 * Helper function to find a user by phone number using the admin SDK.
 */
async function findUserByPhone(supabaseAdmin: ReturnType<typeof createAdminClient>, phone: string) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    return users.find(u => u.phone === phone) || null;
}

/**
 * Sends OTP using a direct fetch call to the Kavenegar VerifyLookup API.
 */
async function sendKavenegarOtp(phone: string, token: string) {
    const url = `https://api.kavenegar.com/v1/${KAVEHNEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append("receptor", phone);
    params.append("token", token);
    params.append("template", "logincode"); // This is the template name in your Kavenegar panel.

    try {
        const response = await fetch(url, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        if (response.status === 200 && data.return.status === 200) {
            console.log('Kavenegar VerifyLookup response:', data);
            return { error: null };
        } else {
            const errorMessage = data?.return?.message || `خطا در ارسال پیامک. کد خطا: ${response.status}`;
            console.error(`Kavenegar API Error: Status ${response.status}, Response:`, data);
            return { error: errorMessage };
        }
    } catch (error: any) {
        console.error('Failed to send Kavenegar OTP via fetch:', error);
        return { error: error.message || 'خطای ناشناخته در ارسال کد تایید.' };
    }
}


/**
 * Initiates the login process by generating, storing, and sending an OTP.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }
  
  const supabaseAdmin = createAdminClient();
  const normalizedPhone = normalizePhoneNumber(phone);
  const token = Math.floor(100000 + Math.random() * 900000).toString();

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
  
  // Use the direct fetch function to send the OTP
  const { error: smsError } = await sendKavenegarOtp(normalizedPhone, token);
  if (smsError) {
      return { error: smsError };
  }

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
    
    let userId: string;
    let userFullName: string | undefined;
    let existingUser = null;

    try {
        existingUser = await findUserByPhone(supabaseAdmin, normalizedPhone);
        
        if (!existingUser) {
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                phone: normalizedPhone,
                password: SUPABASE_MASTER_PASSWORD, // Use a strong, static password for all OTP users
                phone_confirm: true,
            });

            if (createError || !createData?.user) {
                console.error('Supabase createUser error:', createError);
                return { error: `خطا در ایجاد حساب کاربری جدید: ${createError?.message}` };
            }
            existingUser = createData.user;
        }

        userId = existingUser.id;
        userFullName = existingUser.user_metadata?.full_name;

    } catch (error: any) {
        console.error('Error during user check/creation:', error.message);
        return { error: `خطایی در سیستم احراز هویت رخ داد: ${error.message}` };
    }
    
    // After user exists, sign them in to create a session
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
    
    // If the user is new (has no name), redirect to complete registration. Otherwise, home.
    if (!userFullName) {
       redirect(`/register?phone=${phone}`);
     }

    redirect('/');
}
