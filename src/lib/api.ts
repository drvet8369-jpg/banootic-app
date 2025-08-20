'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';
import { defaultProviders } from './data';

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  isSupabaseConfigured = true;
} else {
  console.warn(`
  ****************************************************************
  ** WARNING: Supabase environment variables are not set.       **
  ** Database features will be disabled. App will run in        **
  ** read-only/simulated mode.                                  **
  ****************************************************************
  `);
  // Create a dummy client to prevent chained method calls from crashing the app
  const dummyClient: any = new Proxy({}, {
    get(target, prop) {
      if (prop === 'from') {
        return () => dummyClient;
      }
      if (typeof prop === 'string' && ['select', 'insert', 'update', 'eq', 'order', 'maybeSingle', 'single'].includes(prop)) {
        return () => dummyClient;
      }
      return () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
    }
  });
  supabase = dummyClient as SupabaseClient;
}


const BUCKET_NAME = 'provider-images';

// --- Helper Functions ---
async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string, defaultValue: T): Promise<T> {
    if (!isSupabaseConfigured) {
        return defaultValue;
    }
    const { data, error } = await request;
    if (error) {
        console.error(errorMessage, error.message);
        throw new Error(`${errorMessage} Error: ${error.message}`);
    }
    return data as T;
}

// ========== Provider Functions ==========

export async function getAllProviders(): Promise<Provider[]> {
    if (!isSupabaseConfigured) {
        return defaultProviders;
    }
    const providers = await handleSupabaseRequest(
        supabase.from('providers').select('*').order('name', { ascending: true }),
        "Could not fetch providers.",
        [] // Return empty array if not configured
    );
    return providers.length > 0 ? providers : defaultProviders;
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    if (!isSupabaseConfigured) return defaultProviders.filter(p => p.category_slug === categorySlug);
    return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('category_slug', categorySlug),
        "Could not fetch providers for this category.",
        []
    );
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    if (!isSupabaseConfigured) return defaultProviders.filter(p => p.service_slug === serviceSlug);
     return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('service_slug', serviceSlug),
        "Could not fetch providers for this service.",
        []
    );
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    if (!isSupabaseConfigured) {
        return defaultProviders.find(p => p.phone === phone) || null;
    }
    const provider = await handleSupabaseRequest(
        supabase.from('providers').select('*').eq('phone', phone).maybeSingle(),
        "Error fetching provider by phone",
        null
    );
    return provider;
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING PROVIDER CREATION");
        const newId = Math.floor(Math.random() * 10000);
        return { ...providerData, id: newId, rating: 0, reviews_count: 0 } as Provider;
    }
    return handleSupabaseRequest(
        supabase.from('providers').insert([{ ...providerData, rating: 0, reviews_count: 0 }]).select().single(),
        "Error creating provider.",
        {} as Provider
    );
}


export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    if (!isSupabaseConfigured) {
      console.log("SIMULATING PROVIDER UPDATE", {phone, details});
      const provider = await getProviderByPhone(phone);
      if (!provider) throw new Error("Provider not found for simulation");
      return {...provider, ...details};
    }
    return handleSupabaseRequest(
        supabase.from('providers').update(details).eq('phone', phone).select().single(),
        "Could not update provider details.",
        {} as Provider
    );
}

async function uploadImageFromBase64(base64Data: string, phone: string): Promise<string> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING IMAGE UPLOAD");
        return "https://placehold.co/400x400.png";
    }
    if (!base64Data) throw new Error("No image data provided for upload.");

    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const base64String = base64Data.split(';base64,').pop();

    if (!base64String) throw new Error('Invalid base64 string');

    const fileBuffer = Buffer.from(base64String, 'base64');
    const filePath = `${phone}/${Date.now()}.${fileExtension}`;
    
    await handleSupabaseRequest(
        supabase.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, { contentType: mimeType, upsert: true }),
        `Failed to upload image`,
        null
    );

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    if (!publicUrlData) throw new Error('Could not get public URL for the uploaded file.');

    return publicUrlData.publicUrl;
}

export async function addPortfolioItem(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING ADD PORTFOLIO ITEM");
        const provider = await getProviderByPhone(phone);
        if(!provider) throw new Error("Provider not found for simulation");
        provider.portfolio.push({ src: 'https://placehold.co/400x400.png', aiHint });
        return provider;
    }
    const imageUrl = await uploadImageFromBase64(base64Data, phone);
    const newItem: PortfolioItem = { src: imageUrl, aiHint };

    const {data: currentProvider} = await supabase.from('providers').select('portfolio').eq('phone', phone).single();
    const updatedPortfolio = [...(currentProvider?.portfolio || []), newItem];

    return handleSupabaseRequest(
        supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', phone).select().single(),
        "Could not add portfolio item to database.",
        {} as Provider
    );
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
     if (!isSupabaseConfigured) {
        console.log("SIMULATING DELETE PORTFOLIO ITEM");
        const provider = await getProviderByPhone(phone);
        if(!provider) throw new Error("Provider not found for simulation");
        provider.portfolio.splice(itemIndex, 1);
        return provider;
    }

    const { data: currentProvider } = await supabase.from('providers').select('portfolio').eq('phone', phone).single();
    if (!currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) {
        throw new Error("Provider or portfolio item not found.");
    }
    
    const itemToDelete = currentProvider.portfolio[itemIndex];
    const filePath = itemToDelete.src.split(`${BUCKET_NAME}/`)[1];
    
    if (filePath && !filePath.startsWith('https://placehold.co')) {
      await handleSupabaseRequest(
        supabase.storage.from(BUCKET_NAME).remove([filePath]),
        "Failed to delete from storage, but proceeding to update DB.",
        null
      );
    }

    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);

    return handleSupabaseRequest(
      supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', phone).select().single(),
      "Could not delete portfolio item from database.",
      {} as Provider
    );
}

export async function updateProviderProfileImage(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING UPDATE PROFILE IMAGE");
        const provider = await getProviderByPhone(phone);
        if(!provider) throw new Error("Provider not found for simulation");
        provider.profileimage.src = base64Data || 'https://placehold.co/400x400.png';
        return provider;
    }
    const imageUrl = base64Data ? await uploadImageFromBase64(base64Data, phone) : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };

    return handleSupabaseRequest(
        supabase.from('providers').update({ profileimage: newProfileImage }).eq('phone', phone).select().single(),
        "Could not update profile image in database.",
        {} as Provider
    );
}

// ========== Customer Functions ==========

export async function getCustomerByPhone(phone: string): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    return handleSupabaseRequest(
        supabase
            .from("customers")
            .select("name, phone, accountType:account_type")
            .eq("phone", phone)
            .maybeSingle(),
        "Error fetching customer by phone",
        null
    );
}


export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING CUSTOMER CREATION", userData);
        return { ...userData, accountType: 'customer' };
    }
     const { data, error } = await supabase
        .from('customers')
        .insert([{ name: userData.name, phone: userData.phone, account_type: 'customer' }])
        .select('name, phone, accountType:account_type')
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('This phone number is already registered.');
        throw new Error('Could not create customer account.');
    }
    return data as User;
}

// ========== Review Functions ==========

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    return handleSupabaseRequest(
        supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }),
        "Could not fetch reviews.",
        []
    );
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING ADD REVIEW");
        return {
            ...reviewData,
            id: Math.floor(Math.random() * 10000),
            created_at: new Date().toISOString()
        };
    }
    const newReview = await handleSupabaseRequest(
        supabase.from('reviews').insert([reviewData]).select().single(),
        "Could not add review.",
        null
    );
    if(newReview) await updateProviderRating(reviewData.provider_id);
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
      "Could not update provider rating.",
      null
    );
}

// ========== Agreement Functions ==========

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    if (!isSupabaseConfigured) {
        console.log("SIMULATING AGREEMENT CREATION");
        return {
            id: Math.floor(Math.random() * 10000),
            provider_phone: provider.phone,
            customer_phone: customer.phone,
            customer_name: customer.name,
            status: 'pending',
            requested_at: new Date().toISOString(),
        }
    }
    const agreementData = {
        provider_phone: provider.phone,
        customer_phone: customer.phone,
        customer_name: customer.name,
        status: 'pending' as const,
    };
    
    return handleSupabaseRequest(
        supabase.from('agreements').insert([agreementData]).select().single(),
        "Error creating agreement.",
        {} as Agreement
    );
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    return handleSupabaseRequest(
        supabase.from('agreements').select('*').eq('provider_phone', providerPhone).order('requested_at', { ascending: false }),
        "Could not fetch provider agreements.",
        []
    );
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    return handleSupabaseRequest(
        supabase.from('agreements').select('*').eq('customer_phone', customerPhone).order('requested_at', { ascending: false }),
        "Could not fetch customer agreements.",
        []
    );
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
     if (!isSupabaseConfigured) {
        console.log("SIMULATING AGREEMENT CONFIRMATION");
        return {
            id: agreementId,
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
        } as Agreement;
    }
    return handleSupabaseRequest(
        supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single(),
        "Could not confirm agreement.",
        {} as Agreement
    );
}