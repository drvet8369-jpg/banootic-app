
'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.warn(`
  ****************************************************************
  ** WARNING: Supabase environment variables are not set.       **
  ** Database features will be disabled.                        **
  ** Please set NEXT_PUBLIC_SUPABASE_URL and                     **
  ** SUPABASE_SERVICE_ROLE_KEY in your .env file.                 **
  ****************************************************************
  `);
  // Create a dummy client to avoid crashing the app
  supabase = {
    from: () => ({
      select: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
      insert: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
      update: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
      delete: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: { message: 'Supabase not configured' } }),
        remove: async () => ({ error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      })
    }
  } as unknown as SupabaseClient;
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const BUCKET_NAME = 'provider-images';

// Helper function to handle potential Supabase errors
async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string): Promise<T> {
    const { data, error } = await request;
    if (error) {
        console.error(errorMessage, error.message);
        throw new Error(`${errorMessage} Error: ${error.message}`);
    }
    return data as T;
}


// ========== Provider Functions ==========

export async function getAllProviders(): Promise<Provider[]> {
    return handleSupabaseRequest(
        supabase.from('providers').select('*'),
        "Could not fetch providers."
    );
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('category_slug', categorySlug),
        "Could not fetch providers for this category."
    );
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
     return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('service_slug', serviceSlug),
        "Could not fetch providers for this service."
    );
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

    if (error) {
        console.error("Error fetching provider by phone:", error);
        return null;
    }
    return data;
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    return handleSupabaseRequest(
        supabase
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
            .single(),
        "Error creating provider."
    );
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    return handleSupabaseRequest(
        supabase
            .from('providers')
            .update(details)
            .eq('phone', phone)
            .select()
            .single(),
        "Could not update provider details."
    );
}

async function uploadImageFromBase64(base64Data: string, phone: string): Promise<string> {
    if (!base64Data) throw new Error("No image data provided for upload.");

    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const base64String = base64Data.split(';base64,').pop();

    if (!base64String) throw new Error('Invalid base64 string');

    const fileBuffer = Buffer.from(base64String, 'base64');
    const filePath = `${phone}/${Date.now()}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    if (!publicUrlData) throw new Error('Could not get public URL for the uploaded file.');

    return publicUrlData.publicUrl;
}

export async function addPortfolioItem(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const imageUrl = await uploadImageFromBase64(base64Data, phone);
    const newItem: PortfolioItem = { src: imageUrl, aiHint };

    const currentProvider = await handleSupabaseRequest(
      supabase.from('providers').select('portfolio').eq('phone', phone).single(),
      "Could not find provider to update portfolio."
    );
    
    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];

    return handleSupabaseRequest(
        supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', phone).select().single(),
        "Could not add portfolio item to database."
    );
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const currentProvider = await handleSupabaseRequest(
        supabase.from('providers').select('portfolio').eq('phone', phone).single(),
        "Could not find provider or portfolio item to delete."
    );
    if (!currentProvider.portfolio[itemIndex]) throw new Error("Item index out of bounds.");

    const itemToDelete = currentProvider.portfolio[itemIndex];
    const filePath = itemToDelete.src.split(`${BUCKET_NAME}/`)[1];
    
    if (filePath) {
      await handleSupabaseRequest(
        supabase.storage.from(BUCKET_NAME).remove([filePath]),
        "Failed to delete from storage, but proceeding to update DB:"
      );
    }

    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);

    return handleSupabaseRequest(
      supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', phone).select().single(),
      "Could not delete portfolio item from database."
    );
}

export async function updateProviderProfileImage(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const imageUrl = base64Data ? await uploadImageFromBase64(base64Data, phone) : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };

    return handleSupabaseRequest(
        supabase.from('providers').update({ profileimage: newProfileImage }).eq('phone', phone).select().single(),
        "Could not update profile image in database."
    );
}

// ========== Customer Functions ==========

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
    return data as User | null;
}

export async function createCustomer(userData: { name: string, phone: string }): Promise<User> {
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
        "Could not fetch reviews."
    );
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const newReview = await handleSupabaseRequest(
        supabase.from('reviews').insert([reviewData]).select().single(),
        "Could not add review."
    );
    await updateProviderRating(reviewData.provider_id);
    return newReview;
}

async function updateProviderRating(providerId: number) {
    const reviews = await handleSupabaseRequest(
      supabase.from('reviews').select('rating').eq('provider_id', providerId),
      "Could not fetch reviews for rating update."
    );

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
    const agreementData = {
        provider_phone: provider.phone,
        customer_phone: customer.phone,
        customer_name: customer.name,
        status: 'pending' as const,
    };
    
    return handleSupabaseRequest(
        supabase.from('agreements').insert([agreementData]).select().single(),
        "Error creating agreement."
    );
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    return handleSupabaseRequest(
        supabase.from('agreements').select('*').eq('provider_phone', providerPhone).order('requested_at', { ascending: false }),
        "Could not fetch provider agreements."
    );
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    return handleSupabaseRequest(
        supabase.from('agreements').select('*').eq('customer_phone', customerPhone).order('requested_at', { ascending: false }),
        "Could not fetch customer agreements."
    );
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    return handleSupabaseRequest(
        supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single(),
        "Could not confirm agreement."
    );
}
