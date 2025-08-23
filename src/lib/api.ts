// This file interacts with the Supabase backend.
// It is designed to be used in 'use client' contexts.
import type { Provider, Review, Agreement } from './types';
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@/context/AuthContext';


export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected, but 0 rows found"
    console.error('Error fetching provider by phone:', error);
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


export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count' | 'profile_image' | 'portfolio' | 'created_at' | 'user_id'>): Promise<Provider> {
    const supabase = createClient();
    
    // We don't have Supabase Auth users, so we can't link user_id here.
    // This is a placeholder for if we add full Supabase auth later.
    
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

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

    if (error) {
        console.error('Error adding review:', error);
        throw error;
    }

    // After adding a review, we need to recalculate the provider's average rating.
    await updateProviderRating(reviewData.provider_id);

    return data;
}

export async function updateProviderRating(providerId: string): Promise<void> {
    const supabase = createClient();

    // This calls a PostgreSQL function defined in our database.
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

export async function createAgreement(provider: Provider, customer: AuthUser): Promise<Agreement> {
    const supabase = createClient();
    const agreementData = {
        provider_id: provider.id,
        provider_phone: provider.phone,
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


export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('providers')
        .update(details)
        .eq('phone', phone)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function addPortfolioItem(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createClient();
    const { data: currentProvider, error: fetchError } = await supabase.from('providers').select('portfolio').eq('phone', phone).single();
    if (fetchError) throw fetchError;

    const newPortfolio = [...(currentProvider.portfolio || []), { src: imageUrl, ai_hint: aiHint }];
    
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: newPortfolio })
        .eq('phone', phone)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const supabase = createClient();
    const { data: currentProvider, error: fetchError } = await supabase.from('providers').select('portfolio').eq('phone', phone).single();
    if (fetchError) throw fetchError;

    const currentPortfolio = currentProvider.portfolio || [];
    const newPortfolio = currentPortfolio.filter((_, index) => index !== itemIndex);

    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: newPortfolio })
        .eq('phone', phone)
        .select()
        .single();
        
    if (error) throw error;
    return data;
}

export async function updateProviderProfileImage(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createClient();
    const profileImage = { src: imageUrl, ai_hint: aiHint };
    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: profileImage })
        .eq('phone', phone)
        .select()
        .single();
    if (error) throw error;
    return data;
}
