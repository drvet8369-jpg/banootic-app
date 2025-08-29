
'use server';

import { createActionClient } from './supabase/actions';
import { createAdminClient } from './supabase/server';
import { normalizePhoneNumber } from './utils';
import type { Provider, Review, Agreement, Customer, PortfolioItem, Message, User, Conversation, NewProvider, NewCustomer } from './types';

// --- User, Provider & Customer Functions ---

export async function getUserByPhone(phone: string): Promise<User | null> {
    const supabase = createAdminClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
      console.error('Error fetching user by phone:', error);
    }
    
    return data;
}


export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const supabase = createAdminClient();
  const normalizedPhone = normalizePhoneNumber(phone);
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', normalizedPhone)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching provider by phone:', error);
    // Don't throw here, returning null is a valid outcome.
  }
  
  return data;
}

export async function getAllProviders(): Promise<Provider[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error('Error fetching all providers:', error);
        throw new Error('خطا در دریافت لیست هنرمندان.');
    }
    return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('service_slug', serviceSlug);

    if (error) {
        console.error(`Error fetching providers for service ${serviceSlug}:`, error);
        throw new Error('خطا در دریافت لیست هنرمندان برای این سرویس.');
    }
    return data || [];
}


export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
    const supabase = createAdminClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching customer by phone:', error);
    }
    
    return data;
}

export async function loginAndGetSession(phone: string) {
    const supabase = createAdminClient(); // Use admin client for elevated privileges
    const actionClient = createActionClient(); // Use action client for setting cookies
    const normalizedPhone = normalizePhoneNumber(phone);

    // This is the "magic" step. We use the service_role key on the server
    // to generate a magic link for the user, but we immediately exchange it
    // for a session without sending an email. This securely logs in the user
    // without needing an OTP.
    const { data: userData, error: userError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${normalizedPhone}@example.com`, // Dummy email required by Supabase
    });

    if (userError || !userData.properties) {
        console.error('Error generating auth link for login:', userError);
        throw new Error('خطا در ایجاد لینک ورود امن.');
    }
    
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: userData.properties.hashed_token,
    });
    
    if (sessionError || !sessionData.session) {
        console.error('Error creating session from link:', sessionError);
        throw new Error('خطا در ایجاد جلسه کاربری.');
    }
    
    // Set the cookie for the session using the action client which has cookie access
    const { session } = sessionData;
    if (session) {
        const { error: cookieError } = await actionClient.auth.setSession(session);
        if (cookieError) {
             console.error('Error setting auth cookie:', cookieError);
             throw new Error('خطا در تنظیم کوکی احراز هویت.');
        }
    }
    
    return sessionData.session;
}


export async function createProvider(providerData: NewProvider): Promise<Provider> {
  const supabase = createAdminClient(); // Use Admin for user creation
  const normalizedPhone = normalizePhoneNumber(providerData.phone);
  
  // 1. Create a user in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    phone: normalizedPhone,
    email: `${normalizedPhone}@example.com`, // Dummy email
    phone_confirm: true, // Auto-confirm phone since we are doing this server-side
  });
  
  if (authError || !authData.user) {
    console.error('Error creating user in Supabase Auth:', authError);
    throw new Error('خطا در ساخت حساب کاربری در سیستم احراز هویت.');
  }

  const userId = authData.user.id;

  // 2. Create the user record in public.users
  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    name: providerData.name,
    phone: normalizedPhone,
    account_type: 'provider',
  });

  if (userError) {
    console.error('Error creating provider in public.users table:', userError);
    // TODO: Add cleanup logic to delete the auth user if this step fails
    throw new Error('خطا در ذخیره اطلاعات عمومی کاربر.');
  }

  // 3. Create the provider record in public.providers
  const { data: newProvider, error: providerError } = await supabase
    .from('providers')
    .insert({
      user_id: userId,
      name: providerData.name,
      phone: normalizedPhone,
      service: providerData.service,
      location: providerData.location,
      bio: providerData.bio,
      category_slug: providerData.category_slug,
      service_slug: providerData.service_slug,
    })
    .select()
    .single();

  if (providerError) {
    console.error('Error creating provider in public.providers table:', providerError);
    // TODO: Add cleanup logic
    throw new Error('خطا در ذخیره اطلاعات پروفایل هنرمند.');
  }

  return newProvider;
}

export async function createCustomer(customerData: NewCustomer): Promise<Customer> {
    const supabase = createAdminClient(); // Use Admin for user creation

    const normalizedPhone = normalizePhoneNumber(customerData.phone);

    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        phone: normalizedPhone,
        email: `${normalizedPhone}@example.com`,
        phone_confirm: true,
    });

    if (authError || !authData.user) {
        console.error('Auth Error:', authError);
        throw new Error('خطا در ساخت حساب کاربری.');
    }
    const userId = authData.user.id;

    // 2. Create user in public.users
    const { error: userError } = await supabase.from('users').insert({
        id: userId,
        name: customerData.name,
        phone: normalizedPhone,
        account_type: 'customer',
    });
    if (userError) {
        console.error('User Insert Error:', userError);
        throw new Error('خطا در ذخیره اطلاعات کاربر.');
    }

    // 3. Create customer in public.customers
    const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
            user_id: userId,
            name: customerData.name,
            phone: normalizedPhone,
        })
        .select()
        .single();
    if (customerError) {
        console.error('Customer Insert Error:', customerError);
        throw new Error('خطا در ذخیره پروفایل مشتری.');
    }

    return newCustomer;
}


// --- Review Functions ---

export async function getReviewsByProviderId(providerId: string): Promise<Review[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
     if (error) {
        console.error(`Error fetching reviews for provider ${providerId}:`, error);
        throw new Error('خطا در دریافت نظرات.');
    }
    return data || [];
}


// --- Agreement Functions ---

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('provider_phone', providerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements by provider phone:', error);
        throw new Error('خطا در دریافت توافق‌ها.');
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('requested_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching agreements by customer phone:', error);
        throw new Error('خطا در دریافت درخواست‌ها.');
    }
    return data || [];
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = await createActionClient();
    const { data, error } = await supabase
        .from('agreements')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', agreementId)
        .select()
        .single();
    
    if (error) {
        console.error('Error confirming agreement:', error);
        throw new Error('خطا در تایید توافق.');
    }
    return data;
}


// --- Profile Update Functions ---

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string }): Promise<Provider> {
    const supabase = await createActionClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const { data: updatedProvider, error: providerUpdateError } = await supabase
        .from('providers')
        .update({ name: details.name, service: details.service, bio: details.bio })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (providerUpdateError) {
        console.error("Provider update error:", providerUpdateError);
        throw new Error('خطا در به‌روزرسانی پروفایل هنرمند.');
    }
    
    // Also update the public users table
    const { error: userUpdateError } = await supabase
        .from('users')
        .update({ name: details.name })
        .eq('phone', normalizedPhone);

    if (userUpdateError) {
        console.error("User table update error:", userUpdateError);
        // We don't throw here as the main provider profile was updated, but we log it.
    }

    return updatedProvider;
}

export async function updateProviderProfileImage(phone: string, profileImage: PortfolioItem): Promise<Provider> {
    const supabase = await createActionClient();
    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: profileImage })
        .eq('phone', normalizePhoneNumber(phone))
        .select()
        .single();

    if (error) throw new Error('خطا در به‌روزرسانی عکس پروفایل.');
    return data;
}

export async function updateProviderPortfolio(phone: string, portfolio: PortfolioItem[]): Promise<Provider> {
    const supabase = await createActionClient();
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: portfolio })
        .eq('phone', normalizePhoneNumber(phone))
        .select()
        .single();

    if (error) throw new Error('خطا در به‌روزرسانی نمونه کارها.');
    return data;
}

// --- Chat Functions ---

export async function getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_id_1: userId1,
        p_user_id_2: userId2
    });

    if (error) {
        console.error('Error in get_or_create_conversation RPC:', error);
        throw new Error('خطا در یافتن یا ایجاد گفتگو.');
    }

    // The RPC returns a single row which is the conversation object
    return data as unknown as Conversation;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        throw new Error('خطا در دریافت پیام‌ها.');
    }
    return data || [];
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
    const supabase = await createActionClient();
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error("Error marking messages as read:", error);
    }
}
