
'use server';

import { redirect } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { categories, services as allServices } from '@/lib/constants';
import * as z from 'zod';


/**
 * Initiates the login OR sign-up process by sending an OTP.
 * It uses signInWithOtp which handles both existing and new users.
 */
export async function requestOtp(formData: FormData) {
  const phone = formData.get('phone') as string;
  if (!phone) {
    return { error: 'شماره تلفن الزامی است.' };
  }
  
  const supabase = await createClient();
  const normalizedPhone = normalizePhoneNumber(phone);

  // Reverted to the simplest call that was confirmed to be working.
  // This correctly handles both new user sign-up and existing user sign-in
  // by using the SMS channel and preventing the "recovery" flow.
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      channel: 'sms',
    }
  });

  if (error) {
    console.error('Supabase signInWithOtp Error:', error);
    return { error: `خطا در ارسال کد: ${error.message}` };
  }

  // Redirect to verification page on success
  redirect(`/login/verify?phone=${phone}`);
}


/**
 * Verifies the OTP, and because the user is now logged in,
 * checks if they have a profile. If not, redirects to complete registration.
 */
export async function verifyOtp(formData: FormData) {
    const phone = formData.get('phone') as string;
    const token = formData.get('pin') as string;

    if (!phone || !token) {
        return { error: 'شماره تلفن و کد تایید الزامی است.' };
    }
    
    const supabase = await createClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    // Verify the OTP which also creates the session for the user.
    const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: token,
        type: 'sms',
    });

    if (verifyError || !session) {
        console.error('Supabase verifyOtp Error:', verifyError);
        return { error: verifyError?.message || 'کد تایید وارد شده نامعتبر است یا منقضی شده است.' };
    }
    
    // Now that the user is logged in, check if their profile exists.
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single();
    
    if (!profile) {
       // If no profile, they need to complete registration.
       redirect(`/register?phone=${phone}`);
     } else {
       // If profile exists, they are fully registered.
       redirect('/');
     }
}


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider']),
  name: z.string().min(2),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
});


/**
 * Handles the final step of registration: creating the user's profile
 * after they have already been authenticated via OTP.
 */
export async function registerUser(formData: FormData) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'جلسه کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.' };
  }

  const userId = session.user.id;
  const userPhone = session.user.phone;

  if (!userPhone) {
    return { error: 'شماره تلفن کاربر یافت نشد. این یک خطای غیرمنتظره است.' };
  }

  const values = Object.fromEntries(formData.entries());
  
  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'اطلاعات وارد شده نامعتبر است.' };
  }

  const { name, accountType, serviceId, bio } = parsed.data;

  const supabaseAdmin = createAdminClient();
  
  // Double-check if a profile already exists, just in case.
  const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).single();
  if (existingProfile) {
    redirect('/'); // Already registered, send them to the home page.
  }

  // Update user metadata in auth schema
  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name, account_type: accountType },
  });

  if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        return { error: 'خطا در به‌روزرسانی اطلاعات کاربر.' };
  }

  // Create profile in `profiles` table
  const { error: profileInsertError } = await supabaseAdmin
    .from('profiles')
    .insert({
        id: userId,
        full_name: name,
        phone: userPhone,
        account_type: accountType,
    });

  if (profileInsertError) {
      console.error('Error inserting into profiles table:', profileInsertError);
      return { error: `خطای دیتابیس در ساخت پروفایل: ${profileInsertError.message}` };
  }
  
  // If it's a provider, create an entry in the `providers` table
  if (accountType === 'provider') {
    const selectedCategory = categories.find(c => c.id.toString() === serviceId);
    const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

    const { error: providerInsertError } = await supabaseAdmin
        .from('providers')
        .insert({
            profile_id: userId,
            name: name,
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه',
            bio: bio as string,
            category_slug: selectedCategory?.slug,
            service_slug: firstServiceInCat?.slug,
            phone: userPhone,
        });
    
    if (providerInsertError) {
      console.error('Error inserting into providers table:', providerInsertError);
      // Attempt to clean up the created profile if provider creation fails
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      return { error: `خطا در ثبت اطلاعات هنرمند: ${providerInsertError.message}` };
    }
  }

  const destination = accountType === 'provider' ? '/profile' : '/';
  redirect(destination);
}
