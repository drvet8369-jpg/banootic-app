import type { Provider, Review, Agreement, Customer } from './types';
import { createClient } from './supabase/client';

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here.
    console.error('Error fetching provider by phone:', error);
    throw error;
  }
  return data;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching customer by phone:', error);
    throw error;
  }
  return data;
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count' | 'profile_image' | 'portfolio' | 'created_at' | 'user_id' >): Promise<Provider> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('providers')
        .insert(providerData)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating provider:", error);
        throw error;
    }
    return data;
}

export async function createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'user_id'>): Promise<Customer> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating customer:", error);
        throw error;
    }
    return data;
}

export async function getAllProviders(): Promise<Provider[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error('Error fetching all providers:', error);
        throw error;
    }
    return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('providers').select('*').eq('service_slug', serviceSlug);
    if (error) {
        console.error('Error fetching providers by service slug:', error);
        throw error;
    }
    return data || [];
}

export async function getReviewsByProviderId(providerId: string): Promise<Review[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
    return data || [];
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at' >): Promise<Review> {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

    if (error) {
        console.error('Error adding review:', error);
        if (error.code === '23505') { // Unique constraint violation
             throw new Error("You have already submitted a review for this provider.");
        }
        throw error;
    }
    await updateProviderRating(reviewData.provider_id);
    return data;
}

export async function updateProviderRating(providerId: string): Promise<void> {
    const supabase = createClient();
    // This assumes you have a PostgreSQL function named `update_provider_rating` in your database.
    const { error } = await supabase.rpc('update_provider_rating', {
        provider_id_param: providerId
    });

    if (error) {
        console.error('Error updating provider rating:', error);
        throw error;
    }
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('provider_phone', providerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements by provider:', error);
        throw error;
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements by customer:', error);
        throw error;
    }
    return data || [];
}

export async function createAgreement(provider: Provider, customerPhone: string, customerName: string): Promise<Agreement> {
    const supabase = createClient();
    const agreementData = {
        provider_id: provider.id,
        provider_phone: provider.phone,
        customer_phone: customerPhone,
        customer_name: customerName,
    };

    const { data, error } = await supabase
        .from('agreements')
        .insert(agreementData)
        .select()
        .single();

    if (error) {
        console.error('Error creating agreement:', error);
        if (error.code === '23505') {
            throw new Error('شما قبلاً یک درخواست برای این هنرمند ثبت کرده‌اید.');
        }
        throw error;
    }

    return data;
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', agreementId)
        .select()
        .single();
    
    if (error) {
        console.error('Error confirming agreement:', error);
        throw error;
    }
    return data;
}
