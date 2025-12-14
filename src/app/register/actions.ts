
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { normalizePhoneNumber } from '@/lib/utils';
import { categories, services as allServices } from '@/lib/constants';
import * as z from 'zod';
import { redirect } from 'next/navigation';


const formSchema = z.object({
  accountType: z.enum(['customer', 'provider']),
  name: z.string().min(2),
  phone: z.string().regex(/^09\d{9}$/),
  serviceId: z.string().optional(),
  bio: z.string().optional(),
});


export async function registerUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  
  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'اطلاعات وارد شده نامعتبر است.' };
  }
  
  const { name, phone, accountType, serviceId, bio } = parsed.data;
  const normalizedPhone = normalizePhoneNumber(phone);
  
  const supabaseAdmin = createAdminClient();

  // 1. Check if a user with this phone number already exists in auth.users
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      phone: normalizedPhone
  });
  if (listError) {
      console.error("Supabase list users error:", listError);
      return { error: "خطا در بررسی اطلاعات کاربر." };
  }
  
  const existingUser = users.find(u => u.phone === normalizedPhone);

  if (existingUser) {
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', existingUser.id)
        .single();
        
    if (existingProfile) {
        return { error: 'شما قبلاً ثبت‌نام کرده‌اید. لطفاً وارد شوید.' };
    }
  }
  
  // 2. If registering as a provider, check for duplicate business name
  if (accountType === 'provider') {
    const { data: existingProviderByName } = await supabaseAdmin
      .from('providers')
      .select('id')
      .ilike('name', name)
      .single();

    if (existingProviderByName) {
      return { error: 'این نام کسب‌وکار قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.' };
    }
  }

  // 3. Create or get user ID
  let userId: string;
  if (existingUser) {
      userId = existingUser.id;
  } else {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      phone: normalizedPhone,
      password: process.env.SUPABASE_MASTER_PASSWORD,
      phone_confirm: true,
    });

    if (createError || !newUser?.user) {
      console.error('Error creating user in Supabase Auth:', createError);
      return { error: 'خطا در ایجاد حساب کاربری جدید.' };
    }
    userId = newUser.user.id;
  }
  
  // 4. Update user metadata
   const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name, account_type: accountType },
    });
   if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        return { error: 'خطا در به‌روزرسانی اطلاعات کاربر.' };
   }


  // 5. Create profile in `profiles` table
  // This part is now the single source of truth for profile creation.
  const { error: profileInsertError } = await supabaseAdmin
    .from('profiles')
    .insert({
        id: userId,
        full_name: name,
        phone: normalizedPhone,
        account_type: accountType,
    });

  if (profileInsertError) {
      console.error('Error inserting into profiles table:', profileInsertError);
      // Attempt to clean up the created user if profile creation fails
      if (!existingUser) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return { error: `خطای دیتابیس در ساخت پروفایل: ${profileInsertError.message}` };
  }


  // 6. If it's a provider, create an entry in the `providers` table
  if (accountType === 'provider') {
    if (!serviceId || !bio) {
        return { error: "برای هنرمندان، انتخاب نوع خدمات و نوشتن بیوگرافی الزامی است." };
    }
    const selectedCategory = categories.find(c => c.id.toString() === serviceId);
    const firstServiceInCat = allServices.find(s => s.category_id === selectedCategory?.id);

    const { error: providerInsertError } = await supabaseAdmin
        .from('providers')
        .insert({
            profile_id: userId,
            name: name,
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه',
            bio: bio,
            category_slug: selectedCategory?.slug,
            service_slug: firstServiceInCat?.slug,
            phone: normalizedPhone,
        });
    
    if (providerInsertError) {
      console.error('Error inserting into providers table:', providerInsertError);
      // Attempt to clean up user & profile if provider creation fails
      if (!existingUser) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return { error: `خطا در ثبت اطلاعات هنرمند: ${providerInsertError.message}` };
    }
  }

  // 7. Sign the user in to create a session
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    phone: normalizedPhone,
    password: process.env.SUPABASE_MASTER_PASSWORD,
  });

  if (signInError) {
    console.error('Error signing in after registration:', signInError);
    return { error: 'خطا در ورود خودکار پس از ثبت‌نام.' };
  }
  
  const destination = accountType === 'provider' ? '/profile' : '/';
  redirect(destination);
}
