
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';

// Ensure environment variables are loaded and present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

// Create a single, reusable Supabase client instance.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== Provider Functions ==========

/**
 * Fetches all providers from the database.
 */
export async function getAllProviders(): Promise<Provider[]> {
    const { data, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error("Error fetching all providers:", error.message);
        throw new Error("Could not fetch providers.");
    }
    return data || [];
}

/**
 * Fetches all providers within a specific category slug.
 */
export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('category_slug', categorySlug);
    
    if (error) {
        console.error("Error fetching providers by category:", error.message);
        throw new Error("Could not fetch providers for this category.");
    }
    return data || [];
}

/**
 * Fetches all providers for a specific service slug.
 */
export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('service_slug', serviceSlug);

    if (error) {
        console.error("Error fetching providers by service slug:", error.message);
        throw new Error("Could not fetch providers for this service.");
    }
    return data || [];
}


/**
 * Fetches a single provider by their phone number.
 * Returns null if no provider is found or an error occurs.
 */
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

    if (error) {
        console.error("Error fetching provider by phone:", error);
        // Do not throw an error here, just return null so the UI can handle 'not found'
        return null;
    }
    
    return data || null;
}


/**
 * Creates a new provider in the database.
 */
export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .insert([
            { 
              name: providerData.name,
              service: providerData.service,
              location: providerData.location,
              phone: providerData.phone,
              bio: providerData.bio,
              category_slug: providerData.category_slug,
              service_slug: providerData.service_slug,
              rating: 0, 
              reviews_count: 0,
              profileimage: providerData.profileimage,
              portfolio: providerData.portfolio
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating provider:", error.message);
        // Rethrow the original Supabase error for more detailed debugging.
        throw error;
    }
    return data;
}

/**
 * Updates a provider's core details (name, service, bio).
 */
export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update(details)
        .eq('phone', phone)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating provider details:", error.message);
        throw new Error("Could not update provider details.");
    }
    return data;
}

/**
 * Appends a new item to a provider's portfolio.
 */
export async function addPortfolioItem(phone: string, newItem: PortfolioItem): Promise<Provider> {
    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', phone)
        .single();

    if (fetchError || !currentProvider) {
        console.error("Error fetching provider to add portfolio:", fetchError?.message);
        throw new Error("Could not find provider to update portfolio.");
    }
    
    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];

    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error adding portfolio item:", error.message);
        throw new Error("Could not add portfolio item.");
    }
    return data;
}

/**
 * Removes an item from a provider's portfolio by its index.
 */
export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', phone)
        .single();

    if (fetchError || !currentProvider) {
        console.error("Error fetching provider to delete portfolio:", fetchError?.message);
        throw new Error("Could not find provider to update portfolio.");
    }

    const updatedPortfolio = (currentProvider.portfolio || []).filter((_: any, index: number) => index !== itemIndex);

    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', phone)
        .select()
        .single();
    
    if (error) {
        console.error("Error deleting portfolio item:", error.message);
        throw new Error("Could not delete portfolio item.");
    }
    return data;
}


/**
 * Updates a provider's profile image.
 */
export async function updateProviderProfileImage(phone: string, profileImage: PortfolioItem): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ profileimage: profileImage })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error updating profile image:", error.message);
        throw new Error("Could not update profile image.");
    }
    return data;
}

// ========== Customer Functions ==========

/**
 * Fetches a single customer by their phone number.
 * Returns null if no customer is found or an error occurs.
 */
export async function getCustomerByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabase
        .from("customers")
        .select("name, phone, accountType:account_type")
        .eq("phone", phone)
        .maybeSingle();

    if (error) {
        console.error("Error fetching customer by phone:", error);
        return null;
    }
    
    return data || null;
}


/**
 * Creates a new customer in the database.
 */
export async function createCustomer(userData: { name: string, phone: string }): Promise<User> {
    const { data, error } = await supabase
        .from('customers')
        .insert([{
            name: userData.name,
            phone: userData.phone,
            account_type: 'customer'
        }])
        .select('name, phone, accountType:account_type')
        .single();

    if (error) {
        console.error('Error creating customer:', error);
         if (error.code === '23505') { // Unique constraint violation
             throw new Error('This phone number is already registered.');
        }
        throw new Error('Could not create customer account.');
    }
    
    return data as User;
}

// ========== Review Functions ==========

/**
 * Fetches all reviews for a specific provider.
 */
export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching reviews:", error.message);
        return [];
    }
    return data || [];
}

/**
 * Adds a new review for a provider and updates the provider's average rating.
 */
export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const { data, error } = await supabase
        .from('reviews')
        .insert([{
          provider_id: reviewData.provider_id,
          author_name: reviewData.author_name,
          rating: reviewData.rating,
          comment: reviewData.comment
        }])
        .select()
        .single();

    if (error) {
        console.error("Error adding review:", error.message);
        throw new Error("Could not add review.");
    }
    
    // After adding the review, recalculate and update the provider's rating.
    await updateProviderRating(reviewData.provider_id);

    return data;
}

/**
 * Recalculates and updates a provider's average rating and review count.
 * This is a private helper function.
 */
async function updateProviderRating(providerId: number) {
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', providerId);

    if (reviewsError) {
        console.error("Error fetching reviews for rating update:", reviewsError.message);
        return;
    }

    const reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    
    const { error: updateError } = await supabase
        .from('providers')
        .update({ rating: newAverageRating, reviews_count: reviewsCount })
        .eq('id', providerId);
    
    if (updateError) {
        console.error("Error updating provider rating:", updateError.message);
    }
}


// ========== Agreement Functions ==========

/**
 * Creates a new agreement request from a customer to a provider.
 */
export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    const agreementData = {
        provider_phone: provider.phone,
        customer_phone: customer.phone,
        customer_name: customer.name,
        status: 'pending' as const,
    };
    
    const { data, error } = await supabase
        .from('agreements')
        .insert([agreementData])
        .select()
        .single();

    if (error) {
        console.error("Error creating agreement:", error.message);
        throw error;
    }
    return data;
}

/**
 * Fetches all agreements for a specific provider.
 */
export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('provider_phone', providerPhone)
        .order('requested_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching provider agreements:", error.message);
        return [];
    }
    return data || [];
}

/**
 * Fetches all agreements initiated by a specific customer.
 */
export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error("Error fetching customer agreements:", error.message);
        return [];
    }
    return data || [];
}


/**
 * Confirms an agreement, updating its status and timestamp.
 */
export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const { data, error } = await supabase
        .from('agreements')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', agreementId)
        .select()
        .single();
    
    if (error) {
        console.error("Error confirming agreement:", error.message);
        throw new Error("Could not confirm agreement.");
    }
    return data;
}
