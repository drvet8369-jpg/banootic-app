// This file interacts with the Supabase backend.
// It is designed to be used in 'use client' and 'use server' contexts.

import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from './utils';
import { createClient } from '@supabase/supabase-js';

// This function is intended to be called from a server component or route handler
// where cookie-based auth is not straightforward. It uses the service role key for elevated privileges.
const createServerAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Server-side Supabase credentials are not available.");
    }
    
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}

// Universal function to get a Supabase client, works on client and server
const getClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials are not available.");
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

// --- Provider Functions ---

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const supabase = getClient();
  const normalizedPhone = normalizePhoneNumber(phone);
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', normalizedPhone)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected, but 0 rows found"
    console.error('Error fetching provider by phone:', error);
    throw error;
  }

  return data;
}

export async function getAllProviders(): Promise<Provider[]> {
  const supabase = getClient();
  const { data, error } = await supabase.from('providers').select('*');
  if (error) {
      console.error('Error fetching all providers:', error);
      throw error;
  }
  return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = getClient();
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('service_slug', serviceSlug);

    if (error) {
        console.error('Error fetching providers by service slug:', error);
        throw error;
    }
    return data || [];
}


export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count' | 'profile_image' | 'portfolio'>): Promise<Provider> {
    const supabase = getClient();
    
    const newProvider = {
        ...providerData,
        phone: normalizePhoneNumber(providerData.phone),
    };

    const { data, error } = await supabase
        .from('providers')
        .insert(newProvider)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating provider:", error);
        throw error;
    }

    return data;
}


export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const supabase = getClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const { data: updatedProvider, error } = await supabase
        .from('providers')
        .update({
            name: details.name,
            service: details.service,
            bio: details.bio
        })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (error || !updatedProvider) {
        console.error('Error updating provider details:', error);
        throw new Error("خطا در به‌روزرسانی اطلاعات.");
    }
    return updatedProvider;
}

export async function addPortfolioItem(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = getClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', normalizedPhone)
        .single();
    
    if(fetchError || !currentProvider) {
         throw new Error("هنرمند برای افزودن نمونه‌کار یافت نشد.");
    }

    const newPortfolioItem: PortfolioItem = { src: imageUrl, ai_hint: aiHint };
    const updatedPortfolio = [...(currentProvider.portfolio || []), newPortfolioItem];

    const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (updateError || !updatedProvider) {
        throw new Error("خطا در افزودن نمونه‌کار به پروفایل.");
    }
    return updatedProvider;
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const supabase = getClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', normalizedPhone)
        .single();

    if (fetchError || !currentProvider) {
        throw new Error("هنرمند برای حذف نمونه‌کار یافت نشد.");
    }

    const itemToDelete = currentProvider.portfolio?.[itemIndex];
    const updatedPortfolio = (currentProvider.portfolio || []).filter((_, index) => index !== itemIndex);

    const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (updateError || !updatedProvider) {
        throw new Error("خطا در حذف نمونه‌کار از پروفایل.");
    }

    // After successfully updating the database, delete the file from storage
    if (itemToDelete?.src) {
        try {
            const path = new URL(itemToDelete.src).pathname.replace(/^\/storage\/v1\/object\/public\/images\//, '');
            if(path) {
              const { error: storageError } = getClient().storage.from('images').remove([path]);
              if (storageError) {
                  console.error('Could not delete old image from storage:', storageError.message);
              }
            }
        } catch (e) {
            console.error('Error parsing or deleting old portfolio image from storage:', e);
        }
    }
    
    return updatedProvider;
}

export async function updateProviderProfileImage(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = getClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    // 1. Find the provider and get their current profile image URL
    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('profile_image')
        .eq('phone', normalizedPhone)
        .single();

    if (fetchError || !currentProvider) {
        throw new Error("هنرمند برای بروزرسانی عکس پروفایل یافت نشد.");
    }

    const oldImageSrc = currentProvider.profile_image?.src;

    // 2. Prepare the new profile image object
    const newProfileImage: PortfolioItem = {
        src: imageUrl || '', // Store empty string if no URL
        ai_hint: imageUrl ? aiHint : '',
    };
    
    // 3. Update the database with the new profile image object
    const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ profile_image: newProfileImage })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (updateError || !updatedProvider) {
        throw new Error("خطا در به‌روزرسانی عکس پروفایل.");
    }

    // 4. If there was an old image, and it wasn't a placeholder, delete it from storage
    if (oldImageSrc && !oldImageSrc.includes('placehold.co')) {
        try {
            const path = new URL(oldImageSrc).pathname.replace(/^\/storage\/v1\/object\/public\/images\//, '');
            if(path) {
              const { error: storageError } = getClient().storage.from('images').remove([path]);
              if (storageError) {
                  // This is not a critical error, so we just log it.
                  console.error('Could not delete old image from storage:', storageError.message);
              }
            }
        } catch (e) {
            console.error('Error parsing or deleting old image from storage:', e);
        }
    }

    return updatedProvider;
}


// --- Review Functions ---

export async function getReviewsByProviderId(providerId: string): Promise<Review[]> {
    const supabase = getClient();
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
    const supabase = getClient();
    const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding review:', error);
        throw new Error("خطا در ثبت نظر.");
    }
    return data;
}

// --- Agreement Functions ---

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    const supabase = getClient();
    const agreement = {
        provider_phone: provider.phone,
        customer_phone: customer.phone,
        customer_name: customer.name,
        status: 'pending',
    };
    const { data, error } = await supabase
        .from('agreements')
        .insert(agreement)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating agreement:', error);
        throw error;
    }
    return data;
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const supabase = getClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('provider_phone', normalizePhoneNumber(providerPhone))
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching provider agreements:', error);
        throw error;
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = getClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customer_phone', normalizePhoneNumber(customerPhone))
        .order('requested_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching customer agreements:', error);
        throw error;
    }
    return data || [];
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = getClient();
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
