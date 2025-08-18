
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement } from './types';
import type { User } from '@/context/AuthContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);


// ========== Provider Functions ==========

export async function getAllProviders(): Promise<Provider[]> {
    const { data, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error("Error fetching all providers:", error);
        throw new Error("Could not fetch providers.");
    }
    return data || [];
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const { data, error } = await supabase.from('providers').select('*').eq('phone', phone).single();
    if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows" which is fine.
        console.error("Error fetching provider by phone:", error);
        throw new Error('Could not fetch provider.');
    }
    return data || null;
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviewsCount'>): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .insert([
            { ...providerData, rating: 0, reviewsCount: 0 }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating provider:", error);
        throw error;
    }
    return data;
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update(details)
        .eq('phone', phone)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating provider details:", error);
        throw new Error("Could not update provider details.");
    }
    return data;
}

export async function updateProviderPortfolio(phone: string, portfolio: any[]): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error updating portfolio:", error);
        throw new Error("Could not update portfolio.");
    }
    return data;
}

export async function updateProviderProfileImage(phone: string, profileImage: any): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ profileImage })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error updating profile image:", error);
        throw new Error("Could not update profile image.");
    }
    return data;
}

// ========== Review Functions ==========

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('providerId', providerId)
        .order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching reviews:", error);
        throw new Error("Could not fetch reviews.");
    }
    return data || [];
}

export async function addReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

    if (error) {
        console.error("Error adding review:", error);
        throw new Error("Could not add review.");
    }
    
    await updateProviderRating(reviewData.providerId);

    return data;
}

async function updateProviderRating(providerId: number) {
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('providerId', providerId);

    if (reviewsError) {
        console.error("Error fetching reviews for rating update:", reviewsError);
        return;
    }

    const reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    
    const { error: updateError } = await supabase
        .from('providers')
        .update({ rating: newAverageRating, reviewsCount: reviewsCount })
        .eq('id', providerId);
    
    if (updateError) {
        console.error("Error updating provider rating:", updateError);
    }
}


// ========== Agreement Functions ==========

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    const agreementData = {
        providerPhone: provider.phone,
        customerPhone: customer.phone,
        customerName: customer.name,
        status: 'pending' as const,
    };
    
    const { data, error } = await supabase
        .from('agreements')
        .insert([agreementData])
        .select()
        .single();

    if (error) {
        console.error("Error creating agreement:", error);
        throw error;
    }
    return data;
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('providerPhone', providerPhone)
        .order('requested_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching provider agreements:", error);
        throw new Error("Could not fetch agreements.");
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customerPhone', customerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error("Error fetching customer agreements:", error);
        throw new Error("Could not fetch agreements.");
    }
    return data || [];
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const { data, error } = await supabase
        .from('agreements')
        .update({ status: 'confirmed', confirmedAt: new Date().toISOString() })
        .eq('id', agreementId)
        .select()
        .single();
    
    if (error) {
        console.error("Error confirming agreement:", error);
        throw new Error("Could not confirm agreement.");
    }
    return data;
}


// ========== Customer Functions ==========

export async function getCustomerByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('customers')
        .select('name, phone, account_type')
        .eq('phone', phone)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching customer by phone:', error);
        throw new Error('Could not fetch customer.');
    }
    
    if (!data) return null;

    return {
        name: data.name,
        phone: data.phone,
        accountType: data.account_type as 'customer',
    };
}

export async function createCustomer(userData: { name: string, phone: string }): Promise<User> {
    const { data, error } = await supabase
        .from('customers')
        .insert([{
            name: userData.name,
            phone: userData.phone,
            account_type: 'customer'
        }])
        .select('name, phone, account_type')
        .single();

    if (error) {
        console.error('Error creating customer:', error);
        throw new Error('Could not create customer.');
    }
    return {
      name: data.name,
      phone: data.phone,
      accountType: data.account_type as 'customer',
    };
}
