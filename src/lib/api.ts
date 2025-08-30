
'use server';

import { createActionClient } from './supabase/actions';
import { createAdminClient } from './supabase/server';
import { normalizePhoneNumber } from './utils';
import type { Provider, Review, Agreement, PortfolioItem, Message, UserProfile, Conversation } from './types';

// --- User, Provider & Customer Functions ---

export async function getUserByPhone(phone: string): Promise<UserProfile | null> {
    const supabase = createAdminClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching user by phone:', error);
    }
    
    return data;
}

export async function getProviderByUserId(userId: string): Promise<Provider | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching provider for user_id ${userId}:`, error);
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

// --- Review Functions ---

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
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

export async function updateProviderDetails(userId: string, details: { name: string; service: string; bio: string; phone: string }): Promise<Provider> {
    const supabase = await createActionClient();
    
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ name: details.name, phone: details.phone })
      .eq('id', userId);

    if (userUpdateError) {
        console.error("User table update error:", userUpdateError);
        throw new Error('خطا در به‌روزرسانی اطلاعات عمومی کاربر.');
    }

    const { data: updatedProvider, error: providerUpdateError } = await supabase
        .from('providers')
        .update({ name: details.name, service: details.service, bio: details.bio, phone: details.phone })
        .eq('user_id', userId)
        .select()
        .single();

    if (providerUpdateError) {
        console.error("Provider update error:", providerUpdateError);
        throw new Error('خطا در به‌روزرسانی پروفایل هنرمند.');
    }

    return updatedProvider;
}

export async function updateProviderProfileImage(userId: string, profileImage: PortfolioItem): Promise<Provider> {
    const supabase = await createActionClient();
    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: profileImage })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error('خطا در به‌روزرسانی عکس پروفایل.');
    return data;
}

export async function updateProviderPortfolio(userId: string, portfolio: PortfolioItem[]): Promise<Provider> {
    const supabase = await createActionClient();
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: portfolio })
        .eq('user_id', userId)
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
