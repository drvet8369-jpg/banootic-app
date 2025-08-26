
'use server';

import type { Provider, Review, Agreement, Customer, PortfolioItem, Message, Service, User } from './types';
import { createAdminClient } from './supabase/server';
import { normalizePhoneNumber } from './utils';

const supabase = createAdminClient();

// --- Provider & Customer Functions ---

export async function getUserByPhone(phone: string): Promise<User | null> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user by phone:', error);
      // Don't throw, just return null so the login page can handle it
    }
    
    return data as User | null;
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const normalizedPhone = normalizePhoneNumber(phone);
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', normalizedPhone)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching provider by phone:', error);
    throw new Error('خطا در ارتباط با پایگاه داده برای یافتن هنرمند.');
  }
  
  return data as Provider | null;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching customer by phone:', error);
      throw new Error('خطا در ارتباط با پایگاه داده برای یافتن مشتری.');
    }
    
    return data as Customer | null;
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'user_id' | 'created_at' | 'rating' | 'reviews_count' | 'profile_image' | 'portfolio'> & { name: string, phone: string, account_type: 'provider' }): Promise<Provider> {
    const { data: newUser, error: userError } = await supabase.from('users').insert({ name: providerData.name, account_type: 'provider', phone: normalizePhoneNumber(providerData.phone) }).select().single();
    if(userError) {
      console.error("Error creating user for provider:", userError);
      if (userError.code === '23505') { // unique_violation on users table
        throw new Error('کاربری با این شماره تلفن از قبل وجود دارد.');
      }
      throw new Error("خطا در ایجاد کاربر اولیه برای هنرمند.");
    }

    const providerInput = {
      user_id: newUser.id,
      name: providerData.name,
      phone: normalizePhoneNumber(providerData.phone),
      service: providerData.service,
      location: providerData.location,
      bio: providerData.bio,
      category_slug: providerData.category_slug,
      service_slug: providerData.service_slug,
    };

    const { data: newProvider, error: providerError } = await supabase
        .from('providers')
        .insert(providerInput)
        .select()
        .single();
    
    if (providerError) {
        console.error("Error creating provider profile:", providerError);
        // Attempt to clean up the user we just created if provider profile fails
        await supabase.from('users').delete().eq('id', newUser.id);
        if (providerError.code === '23505') { // unique_violation on providers table
            throw new Error('یک هنرمند با این شماره تلفن یا نام کاربری از قبل وجود دارد.');
        }
        throw new Error('خطا در ساخت پروفایل هنرمند.');
    }

    return newProvider;
}

export async function createCustomer(customerData: {name: string, phone: string}): Promise<Customer> {
     const normalizedPhone = normalizePhoneNumber(customerData.phone);
     const { data: newUser, error: userError } = await supabase.from('users').insert({ name: customerData.name, account_type: 'customer', phone: normalizedPhone }).select().single();
     if(userError) {
        console.error("Error creating user for customer:", userError);
        if (userError.code === '23505') {
            throw new Error('کاربری با این شماره تلفن از قبل وجود دارد.');
        }
        throw new Error("خطا در ایجاد کاربر اولیه برای مشتری.");
    }
    
    const customerInput = {
      user_id: newUser.id,
      name: customerData.name,
      phone: normalizedPhone,
    };

    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert(customerInput)
      .select()
      .single();

    if(customerError) {
       console.error("Error creating customer profile:", customerError);
       // Attempt to clean up the user we just created
       await supabase.from('users').delete().eq('id', newUser.id);
       throw new Error("خطا در ساخت پروفایل مشتری.");
    }
    return newCustomer;
}

export async function getAllProviders(): Promise<Provider[]> {
    const { data, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error('Error fetching all providers:', error);
        throw new Error('خطا در دریافت لیست هنرمندان.');
    }
    return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const { data, error } = await supabase.from('providers').select('*').eq('service_slug', serviceSlug);
    if (error) {
        console.error(`Error fetching providers for service ${serviceSlug}:`, error);
        throw new Error('خطا در دریافت هنرمندان برای این سرویس.');
    }
    return data || [];
}


// --- Review Functions ---

export async function getReviewsByProviderId(providerId: string): Promise<Review[]> {
    const { data, error } = await supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
     if (error) {
        console.error(`Error fetching reviews for provider ${providerId}:`, error);
        throw new Error('خطا در دریافت نظرات.');
    }
    return data || [];
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at' | 'author_name'> & {user_id: string, author_name: string}): Promise<Review> {
    const { data: newReview, error } = await supabase.from('reviews').insert(reviewData).select().single();
    if(error){
        console.error('Error adding review:', error);
        throw new Error('خطا در ثبت نظر.');
    }
    await updateProviderRating(reviewData.provider_id);
    return newReview;
}

export async function updateProviderRating(providerId: string): Promise<void> {
    const { data: providerReviews, error: reviewError } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
    if(reviewError) {
        console.error(`Error fetching reviews for rating update on provider ${providerId}:`, reviewError);
        return;
    }
    
    const reviews_count = providerReviews.length;
    const rating = reviews_count > 0 
      ? parseFloat((providerReviews.reduce((acc, r) => acc + r.rating, 0) / reviews_count).toFixed(1))
      : 0;
    
    const { error } = await supabase
        .from('providers')
        .update({ rating, reviews_count })
        .eq('id', providerId);
    
    if (error) {
        console.error(`Error updating rating for provider ${providerId}:`, error);
    }
}


// --- Agreement Functions ---

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const { data, error } = await supabase.from('agreements').select('*').eq('provider_phone', normalizePhoneNumber(providerPhone));
    if (error) {
        console.error('Error fetching agreements by provider:', error);
        throw new Error('خطا در دریافت لیست توافق‌ها.');
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const { data, error } = await supabase.from('agreements').select('*').eq('customer_phone', normalizePhoneNumber(customerPhone));
    if (error) {
        console.error('Error fetching agreements by customer:', error);
        throw new Error('خطا در دریافت لیست درخواست‌ها.');
    }
    return data || [];
}

export async function createAgreement(provider: Provider, user: { phone: string, name: string, id: string }): Promise<Agreement> {
    const agreementData = {
        provider_id: provider.id,
        provider_phone: provider.phone,
        customer_id: user.id,
        customer_phone: user.phone,
        customer_name: user.name,
        status: 'pending' as const,
    };
    
    const { data, error } = await supabase.from('agreements').insert(agreementData).select().single();

    if (error) {
        console.error('Error creating agreement:', error);
        if (error.code === '23505') { // unique_violation
            throw new Error('شما قبلاً یک درخواست برای این هنرمند ثبت کرده‌اید.');
        }
        throw new Error('خطا در ارسال درخواست توافق.');
    }
    return data;
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
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


// --- Provider Profile Update Functions ---

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string }): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update(details)
        .eq('phone', normalizePhoneNumber(phone))
        .select()
        .single();
    
    if (error) {
        console.error('Error updating provider details:', error);
        throw new Error('خطا در به‌روزرسانی اطلاعات هنرمند.');
    }
    return data;
}

export async function updateProviderPortfolio(phone: string, portfolio: PortfolioItem[]): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio })
        .eq('phone', normalizePhoneNumber(phone))
        .select()
        .single();
        
    if (error) {
        console.error('Error updating portfolio:', error);
        throw new Error('خطا در به‌روزرسانی نمونه‌کارها.');
    }
    return data;
}

export async function updateProviderProfileImage(phone: string, profileImage: PortfolioItem): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: profileImage })
        .eq('phone', normalizePhoneNumber(phone))
        .select()
        .single();
        
    if (error) {
        console.error('Error updating profile image:', error);
        throw new Error('خطا در به‌روزرسانی عکس پروفایل.');
    }
    return data;
}


// --- Chat Functions ---

export async function getMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error('خطا در دریافت پیام‌ها.');
  }
  return data || [];
}

export async function sendMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw new Error('خطا در ارسال پیام.');
  }
  return data;
}
