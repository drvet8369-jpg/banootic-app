'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { SUPABASE_MASTER_PASSWORD } from '@/lib/server-config';


/**
 * Finds a user by phone number using the admin SDK's listUsers method with pagination.
 * This is a reliable way to check for a user's existence on the server side.
 */
async function findUserByPhone(supabaseAdmin: ReturnType<typeof createAdminClient>, phone: string) {
  let page = 0;
  const perPage = 100;
  while (true) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.error('Supabase listUsers error:', error);
      throw error;
    }

    const found = users.find(u => u.phone === phone);
    if (found) return found;

    if (users.length < perPage) break;
    page++;
  }
  return null;
}


/**
 * Helper function to invoke a Supabase Edge Function.
 * This should be used when a server action needs to call an edge function.
 */
async function invokeSupabaseFunction(functionName: string, body: object) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: JSON.stringify(body),
    });

    if (error) {
        console.error(`Error invoking Supabase function '${functionName}':`, error);
        return { error: `خطا در ارتباط با سرویس ابری (${functionName}).` };
    }
    
    try {
      const result = typeof data === 'string' ? JSON.parse(data) : data;
       if(result.error){
         console.error(`Error returned from Supabase function '${functionName}':`, result.error);
         return { error: result.error };
       }
       return { data: result };
    } catch (e) {
      console.error(`Error parsing response from Supabase function '${functionName}':`, e);
      return { error: 'پاسخ دریافتی از سرویس ابری نامعتبر است.' };
    }
}


/**
 * Initiates the login process by generating, storing, and sending an OTP via a Supabase Edge Function.
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

  const { error: functionError } = await invokeSupabaseFunction('kavenegar-otp-sender', {
      phone: normalizedPhone,
      data: { token: token }
  });

  if (functionError) {
      return { error: `خطا در ارسال کد تایید: ${functionError}` };
  }

  redirect(`/login/verify?phone=${phone}`);
}


/**
 * Verifies the OTP provided by the user.
 */
export async function verifyOtp(formData: FormData) {
    console.log('--- STARTING OTP VERIFICATION ---');
    console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING');
    console.log('SERVICE ROLE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING');
    console.log('MASTER PASSWORD:', process.env.SUPABASE_MASTER_PASSWORD ? 'OK' : 'MISSING');

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
        console.error('OTP validation failed:', selectError);
        return { error: 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' };
    }
    
    let userId: string;
    let userFullName: string | undefined;
    let existingUser = null;

    try {
        existingUser = await findUserByPhone(supabaseAdmin, normalizedPhone);
        
        if (!existingUser) {
            console.log('User does not exist, attempting to create...');
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                phone: normalizedPhone,
                password: SUPABASE_MASTER_PASSWORD,
                phone_confirm: true,
            });

            console.log('createUser error object:', createError);

            if (createError || !createData?.user) {
                console.error('Supabase createUser error:', createError);
                return { error: `خطا در ایجاد حساب کاربری جدید: ${createError?.message}` };
            }
            console.log('User created successfully.');
            existingUser = createData.user;
        }

        userId = existingUser.id;
        userFullName = existingUser.user_metadata?.full_name;

    } catch (error: any) {
        console.error('Error during user check/creation:', error.message);
        return { error: `خطایی در سیستم احراز هویت رخ داد: ${error.message}` };
    }
    
    const supabase = createServerSupabaseClient();
    const { error: sessionError } = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password: SUPABASE_MASTER_PASSWORD,
    });

    if (sessionError) {
        console.error('Supabase Sign-In Error during OTP verify:', sessionError);
        return { error: `خطا در ورود به حساب کاربری: ${sessionError.message}`};
    }
    
    await supabaseAdmin.from('one_time_passwords').delete().eq('phone', normalizedPhone);
    
    if (!userFullName) {
       redirect(`/register?phone=${phone}`);
     }

    redirect('/');
}
