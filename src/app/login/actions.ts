
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { KAVEHNEGAR_API_KEY, SUPABASE_MASTER_PASSWORD } from '@/lib/server-config';
import Kavenegar from 'kavenegar';

/**
 * Helper function to find a user by phone number using the admin SDK.
 */
async function findUserByPhone(supabaseAdmin: ReturnType<typeof createAdminClient>, phone: string) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    return users.find(u => u.phone === phone) || null;
}

/**
 * Sends OTP using the official Kavenegar Node.js library.
 */
async function sendKavenegarOtp(phone: string, token: string) {
    try {
        const api = Kavenegar.KavenegarApi({ apikey: KAVEHNEGAR_API_KEY });
        return new Promise((resolve, reject) => {
            api.VerifyLookup({
                receptor: phone,
                token: token,
                template: 'logincode'
            }, function(response, status) {
                if (status === 200) {
                    console.log('Kavenegar response:', response);
                    resolve({ error: null });
                } else {
                    console.error(`Kavenegar API Error: Status ${status}, Response:`, response);
                    const errorMessage = `خطا در ارسال پیامک. کد خطا: ${status}`;
                    reject(new Error(errorMessage));
                }
            });
        });
    } catch (error: any) {
        console.error('Failed to send Kavenegar OTP:', error);
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
  
  // Use the Kavenegar library to send the OTP
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
