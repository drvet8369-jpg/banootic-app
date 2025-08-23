import type { Provider, Review, Agreement, Customer } from './types';
import { createClient } from './supabase/client';
import type { User as AuthUser } from '@/context/AuthContext';

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
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

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('providers').select('*').eq('category_slug', categorySlug);
    if (error) {
        console.error('Error fetching providers by category slug:', error);
        throw error;
    }
    return data || [];
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count' | 'profile_image' | 'portfolio' >): Promise<Provider> {
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

export async function createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
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

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at' | 'author_name'>): Promise<Review> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to add a review");

    const { data: customer } = await supabase.from('customers').select('name').eq('user_id', user.id).single();
    if (!customer) throw new Error("Customer profile not found");
    
    const reviewPayload = {
      ...reviewData,
      author_name: customer.name,
      user_id: user.id,
    }

    const { data, error } = await supabase
        .from('reviews')
        .insert(reviewPayload)
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

export async function getAgreementsByCustomer(customerUserId: string): Promise<Agreement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customer_user_id', customerUserId)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements by customer:', error);
        throw error;
    }
    return data || [];
}

export async function createAgreement(provider: Provider, customer: AuthUser): Promise<Agreement> {
    const supabase = createClient();
    const agreementData = {
        provider_id: provider.id,
        provider_phone: provider.phone,
        customer_user_id: customer.id,
        customer_phone: customer.phone,
        customer_name: customer.name,
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

export async function updateProviderDetails(userId: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('providers')
        .update(details)
        .eq('user_id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function addPortfolioItem(userId: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createClient();
    const { data: currentProvider, error: fetchError } = await supabase.from('providers').select('portfolio').eq('user_id', userId).single();
    if (fetchError) throw fetchError;

    const newPortfolio = [...(currentProvider.portfolio || []), { src: imageUrl, ai_hint: aiHint }];
    
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: newPortfolio })
        .eq('user_id', userId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function deletePortfolioItem(userId: string, itemIndex: number): Promise<Provider> {
    const supabase = createClient();
    const { data: currentProvider, error: fetchError } = await supabase.from('providers').select('portfolio').eq('user_id', userId).single();
    if (fetchError) throw fetchError;

    const currentPortfolio = currentProvider.portfolio || [];
    const newPortfolio = currentPortfolio.filter((_, index) => index !== itemIndex);

    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: newPortfolio })
        .eq('user_id', userId)
        .select()
        .single();
        
    if (error) throw error;
    return data;
}

export async function updateProviderProfileImage(userId: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createClient();
    const profileImage = { src: imageUrl, ai_hint: aiHint };
    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: profileImage })
        .eq('user_id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}