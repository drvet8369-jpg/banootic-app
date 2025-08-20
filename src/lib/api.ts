
'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';
import { defaultProviders } from './data';
import { normalizePhoneNumber } from './utils';

// --- Supabase Client Initialization (Centralized) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient;
const BUCKET_NAME = 'images';

// A simple flag to check if Supabase is configured, to avoid crashing the app.
const isSupabaseConfigured = supabaseUrl && supabaseKey;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
} else {
  console.error(`
  ****************************************************************
  ** CRITICAL: Supabase environment variables are not set.      **
  ** NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is   **
  ** missing. Database features will be disabled.               **
  ****************************************************************
  `);
  // Create a dummy client to avoid crashing the app if Supabase is not configured.
  const dummyClient: any = new Proxy({}, {
    get(target, prop) {
      if (prop === 'from') {
        return () => dummyClient;
      }
      return () => {
        console.error(`Supabase is not configured. Cannot perform operation: ${String(prop)}`);
        return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
      }
    }
  });
  supabase = dummyClient as SupabaseClient;
}


// --- Helper Function for Clean Error Handling ---
async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string): Promise<T> {
    const { data, error } = await request;
    if (error) {
        console.error(errorMessage, error);
        throw new Error(`${errorMessage} Reason: ${error.message}`);
    }
    return data as T;
}


// ========== Provider Functions ==========

export async function getAllProviders(): Promise<Provider[]> {
    if (!isSupabaseConfigured) return defaultProviders;

    const providers = await handleSupabaseRequest(
        supabase.from('providers').select('*').order('name', { ascending: true }),
        "Could not fetch providers."
    );
    // If database is empty, seed it with default data.
    if (!providers || providers.length === 0) {
        console.log("Database is empty. Seeding with default provider data...");
        const { error: seedError } = await supabase.from('providers').insert(defaultProviders);
        if (seedError) {
            console.error("Failed to seed database:", seedError.message);
            return defaultProviders; 
        }
        return defaultProviders;
    }
    return providers as Provider[];
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    if (!isSupabaseConfigured) return [];
    return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('category_slug', categorySlug),
        "Could not fetch providers for this category."
    );
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    if (!isSupabaseConfigured) return [];
     return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('service_slug', serviceSlug),
        "Could not fetch providers for this service."
    );
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    if (!isSupabaseConfigured) return null;
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('phone', normalizedPhone)
        .maybeSingle();

    if (error) {
        console.error("Error fetching provider by phone", error);
        throw new Error(`Error fetching provider by phone: ${error.message}`);
    }
    return data;
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    if (!isSupabaseConfigured) return { ...defaultProviders[0], ...providerData };
    const dataToInsert = {
      ...providerData,
      phone: normalizePhoneNumber(providerData.phone),
    };
    
    const newProvider = await handleSupabaseRequest(
        supabase.from('providers').insert([{ ...dataToInsert, rating: 0, reviews_count: 0 }]).select().single(),
        "Error creating provider."
    );
    if (!newProvider) throw new Error("Provider creation failed and returned null.");
    return newProvider;
}


export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    if (!isSupabaseConfigured) return { ...defaultProviders[0], ...details };
    const normalizedPhone = normalizePhoneNumber(phone);
    const updatedProvider = await handleSupabaseRequest(
        supabase.from('providers').update(details).eq('phone', normalizedPhone).select().single(),
        "Could not update provider details."
    );
    if (!updatedProvider) throw new Error("Provider update failed and returned null.");
    return updatedProvider;
}

async function uploadImageFromBase64(base64Data: string, phone: string): Promise<string> {
    if (!isSupabaseConfigured) return "https://placehold.co/400x400.png";
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!base64Data) throw new Error("No image data provided for upload.");

    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const base64String = base64Data.split(';base64,').pop();

    if (!base64String) throw new Error('Invalid base64 string');

    const fileBuffer = Buffer.from(base64String, 'base64');
    const filePath = `${normalizedPhone}/${Date.now()}.${fileExtension}`;
    
    await handleSupabaseRequest(
        supabase.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, { contentType: mimeType, upsert: true }),
        `Failed to upload image`
    );

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    if (!publicUrlData) throw new Error('Could not get public URL for the uploaded file.');

    return publicUrlData.publicUrl;
}

export async function addPortfolioItem(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = await uploadImageFromBase64(base64Data, normalizedPhone);
    const newItem: PortfolioItem = { src: imageUrl, aiHint };

    const currentProvider = await getProviderByPhone(normalizedPhone);
    const updatedPortfolio = [...(currentProvider?.portfolio || []), newItem];

    const updatedProvider = await handleSupabaseRequest(
        supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single(),
        "Could not add portfolio item to database."
    );
    if (!updatedProvider) throw new Error("Adding portfolio item failed and returned null.");
    return updatedProvider;
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const normalizedPhone = normalizePhoneNumber(phone);

    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) {
        throw new Error("Provider or portfolio item not found.");
    }
    
    const itemToDelete = currentProvider.portfolio[itemIndex];
    if (isSupabaseConfigured) {
        const filePath = itemToDelete.src.split(`${BUCKET_NAME}/`)[1];
        if (filePath && !filePath.startsWith('https://placehold.co')) {
        await handleSupabaseRequest(
            supabase.storage.from(BUCKET_NAME).remove([filePath]),
            "Failed to delete from storage, but proceeding to update DB."
        );
        }
    }

    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);

    const updatedProvider = await handleSupabaseRequest(
      supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single(),
      "Could not delete portfolio item from database."
    );
    if (!updatedProvider) throw new Error("Deleting portfolio item failed and returned null.");
    return updatedProvider;
}

export async function updateProviderProfileImage(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = base64Data ? await uploadImageFromBase64(base64Data, normalizedPhone) : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };

    const updatedProvider = await handleSupabaseRequest(
        supabase.from('providers').update({ profileimage: newProfileImage }).eq('phone', normalizedPhone).select().single(),
        "Could not update profile image in database."
    );
    if (!updatedProvider) throw new Error("Updating profile image failed and returned null.");
    return updatedProvider;
}

// ========== Customer Functions ==========

export async function getCustomerByPhone(phone: string): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    const normalizedPhone = normalizePhoneNumber(phone);
    
    const { data, error } = await supabase
        .from("customers")
        .select("name, phone, account_type")
        .eq("phone", normalizedPhone)
        .maybeSingle();

    if (error) {
        console.error("Error fetching customer by phone", error);
        throw new Error(`Error fetching customer by phone: ${error.message}`);
    }

    if (!data) return null;
    
    return {
      name: data.name,
      phone: data.phone,
      accountType: data.account_type as 'customer' | 'provider'
    };
}


export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING CUSTOMER CREATION", userData);
        return { ...userData, accountType: 'customer' };
    }

    const dataToInsert = {
      ...userData,
      phone: normalizePhoneNumber(userData.phone),
    };
    
    const { data, error } = await supabase
        .from('customers')
        .insert([dataToInsert])
        .select('name, phone, account_type')
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('This phone number is already registered.');
        console.error("Error creating customer:", error.message);
        throw new Error('Could not create customer account.');
    }
    if (!data) throw new Error("Customer creation returned no data.");
    
    return {
      name: data.name,
      phone: data.phone,
      accountType: data.account_type as 'customer' | 'provider'
    };
}

// ========== Review Functions ==========

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    if (!isSupabaseConfigured) return [];
    return handleSupabaseRequest(
        supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }),
        "Could not fetch reviews."
    );
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (!isSupabaseConfigured) return { id: Date.now(), created_at: new Date().toISOString(), ...reviewData };
    const newReview = await handleSupabaseRequest(
        supabase.from('reviews').insert([reviewData]).select().single(),
        "Could not add review."
    );
    if (!newReview) throw new Error("Adding review failed and returned null.");
    
    await updateProviderRating(reviewData.provider_id);
    return newReview as Review;
}

async function updateProviderRating(providerId: number) {
    if (!isSupabaseConfigured) return;
    const { data: reviews, error } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);

    if (error || !reviews) {
      console.error("Could not fetch reviews for rating update.", error?.message);
      return;
    }

    const reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc: number, r: {rating: number}) => acc + r.rating, 0);
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    
    await handleSupabaseRequest(
      supabase.from('providers').update({ rating: newAverageRating, reviews_count: reviewsCount }).eq('id', providerId),
      "Could not update provider rating."
    );
}

// ========== Agreement Functions ==========

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    if (!isSupabaseConfigured) return { id: Date.now(), provider_phone: provider.phone, customer_phone: customer.phone, customer_name: customer.name, status: 'pending', requested_at: new Date().toISOString() };
    const normalizedProviderPhone = normalizePhoneNumber(provider.phone);
    const normalizedCustomerPhone = normalizePhoneNumber(customer.phone);
    const agreementData = {
        provider_phone: normalizedProviderPhone,
        customer_phone: normalizedCustomerPhone,
        customer_name: customer.name,
        status: 'pending' as const,
    };
    
    const newAgreement = await handleSupabaseRequest(
        supabase.from('agreements').insert([agreementData]).select().single(),
        "Error creating agreement."
    );
    if (!newAgreement) throw new Error("Agreement creation failed and returned null.");
    return newAgreement;
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    if (!isSupabaseConfigured) return [];
    const normalizedPhone = normalizePhoneNumber(providerPhone);
    return handleSupabaseRequest(
        supabase.from('agreements').select('*').eq('provider_phone', normalizedPhone).order('requested_at', { ascending: false }),
        "Could not fetch provider agreements."
    );
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    if (!isSupabaseConfigured) return [];
    const normalizedPhone = normalizePhoneNumber(customerPhone);
    return handleSupabaseRequest(
        supabase.from('agreements').select('*').eq('customer_phone', normalizedPhone).order('requested_at', { ascending: false }),
        "Could not fetch customer agreements."
    );
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    if (!isSupabaseConfigured) return {} as Agreement;
    const confirmedAgreement = await handleSupabaseRequest(
        supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single(),
        "Could not confirm agreement."
    );
    if (!confirmedAgreement) throw new Error("Confirming agreement failed and returned null.");
    return confirmedAgreement;
}
