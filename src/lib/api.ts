
'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';
import { normalizePhoneNumber } from './utils';

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'images';

let supabase: SupabaseClient | null = null;
const isSupabaseConfigured = supabaseUrl && !supabaseUrl.startsWith("YOUR_") && supabaseKey && !supabaseKey.startsWith("YOUR_");

if (isSupabaseConfigured) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        console.log("Supabase client initialized successfully via api.ts.");
    } catch (error) {
        console.error("Supabase client creation failed in api.ts.", error);
        supabase = null;
    }
} else {
    console.warn("Supabase is not configured in api.ts. Database operations will fail. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly in your .env file.");
}

// --- Helper Functions ---
const requireSupabase = () => {
    if (!supabase) {
        throw new Error("This action requires a configured database and cannot be performed. Please check server logs for Supabase configuration errors.");
    }
    return supabase;
}

async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string): Promise<T> {
    const { data, error } = await request;
    if (error) {
        console.error(`${errorMessage}:`, error);
        throw new Error(`A database error occurred. Please try again later. (Details: ${error.message})`);
    }
    return data as T;
}


export type UserRole = 'customer' | 'provider';

// ====================================================================
// --- PRIMARY AUTHENTICATION FUNCTIONS ---
// ====================================================================
export async function loginUser(phone: string, role: UserRole): Promise<{ success: boolean; user?: User; message?: string }> {
    const supabase = requireSupabase();
    const cleanPhone = normalizePhoneNumber(phone);
    const tableName = role === 'provider' ? 'providers' : 'customers';

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, message: 'کاربری با این شماره تلفن و نقش یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' };
            }
            throw error;
        }

        if (data) {
            const userData = data as any;
             const user: User = { 
                name: userData.name,
                phone: userData.phone,
                accountType: role
            };
            return { success: true, user: user };
        }
        
        return { success: false, message: 'کاربر یافت نشد.' };

    } catch (e: any) {
        console.error(`Login failed for ${role} ${cleanPhone}:`, e.message);
        return { success: false, message: `خطا در ورود: ${e.message}` };
    }
}


export async function checkIfUserExists(phone: string): Promise<boolean> {
    const supabase = requireSupabase();
    const cleanPhone = normalizePhoneNumber(phone);

    try {
        const [providerRes, customerRes] = await Promise.all([
            supabase.from('providers').select('id', { count: 'exact', head: true }).eq('phone', cleanPhone),
            supabase.from('customers').select('id', { count: 'exact', head: true }).eq('phone', cleanPhone)
        ]);
        
        if (providerRes.error) console.error("Error checking providers table:", providerRes.error);
        if (customerRes.error) console.error("Error checking customers table:", customerRes.error);

        return (providerRes.count ?? 0) > 0 || (customerRes.count ?? 0) > 0;
    } catch (e: any) {
        console.error(`Error checking user existence for ${cleanPhone}:`, e.message);
        return false;
    }
}


// ========== DATA CREATION FUNCTIONS ==========
export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    const supabase = requireSupabase();
    const dataToInsert = { 
        ...providerData, 
        phone: normalizePhoneNumber(providerData.phone),
        rating: 0, 
        reviews_count: 0 
    };
    const request = supabase.from('providers').insert([dataToInsert]).select().single();
    return await handleSupabaseRequest(request, "Error creating provider in database.");
}

export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    const supabase = requireSupabase();
    const dataToInsert = { ...userData, phone: normalizePhoneNumber(userData.phone) };
    const request = supabase.from('customers').insert([dataToInsert]).select('name, phone, account_type').single();
    const data = await handleSupabaseRequest(request, 'Could not create customer account.');
    return { name: data.name, phone: data.phone, accountType: data.account_type as 'customer' };
}


// ========== DATA RETRIEVAL FUNCTIONS ==========
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const supabase = requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase.from('providers').select('*').eq('phone', normalizedPhone).maybeSingle();
    return await handleSupabaseRequest(request, "Error fetching provider by phone");
}

export async function getAllProviders(): Promise<Provider[]> {
    const supabase = requireSupabase();
    const request = supabase.from('providers').select('*').order('name', { ascending: true });
    return await handleSupabaseRequest(request, "Could not fetch providers.");
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    const supabase = requireSupabase();
    const request = supabase.from('providers').select('*').eq('category_slug', categorySlug);
    return await handleSupabaseRequest(request, "Could not fetch providers for this category.");
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = requireSupabase();
    const request = supabase.from('providers').select('*').eq('service_slug', serviceSlug);
    return await handleSupabaseRequest(request, "Could not fetch providers for this service.");
}

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const supabase = requireSupabase();
    const request = supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
    return await handleSupabaseRequest(request, "Could not fetch reviews.");
}


// ========== DATA MODIFICATION FUNCTIONS ==========
async function uploadImageFromBase64(phone: string, base64Data: string, folder: 'portfolio' | 'profile'): Promise<string> {
    const supabase = requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!base64Data) throw new Error("No image data provided for upload.");

    const mimeTypeMatch = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (!mimeTypeMatch) throw new Error('Invalid base64 string format.');
    
    const mimeType = mimeTypeMatch[1];
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const base64String = base64Data.split(';base64,').pop();

    if (!base64String) throw new Error('Could not extract base64 data from string.');
    
    const fileBuffer = Buffer.from(base64String, 'base64');
    const filePath = `${normalizedPhone}/${folder}/${Date.now()}.${fileExtension}`;
    
    await handleSupabaseRequest(
      supabase.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, { contentType: mimeType, upsert: true }), 
      `Failed to upload image to ${filePath}`
    );
    
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    if (!publicUrlData) throw new Error('Could not get public URL for the uploaded file.');

    return publicUrlData.publicUrl;
}

export async function addPortfolioItem(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const supabase = requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = await uploadImageFromBase64(normalizedPhone, base64Data, 'portfolio');
    const newItem: PortfolioItem = { src: imageUrl, aiHint };

    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider) throw new Error("Provider not found to add portfolio item.");

    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];
    const request = supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return await handleSupabaseRequest(request, "Could not add portfolio item to database.");
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const supabase = requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) {
        throw new Error("Provider or portfolio item not found for deletion.");
    }
    const itemToDelete = currentProvider.portfolio[itemIndex];
    const url = process.env.SUPABASE_URL;
    if (itemToDelete.src && url && itemToDelete.src.includes(url)) {
        const filePath = itemToDelete.src.split(`${BUCKET_NAME}/`)[1];
        if (filePath) {
            await handleSupabaseRequest(
              supabase.storage.from(BUCKET_NAME).remove([filePath]), 
              "Failed to delete image from storage. Proceeding with DB update."
            );
        }
    }
    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);
    const request = supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return await handleSupabaseRequest(request, "Could not delete portfolio item from database.");
}

export async function updateProviderProfileImage(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const supabase = requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = base64Data ? await uploadImageFromBase64(normalizedPhone, base64Data, 'profile') : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };
    const request = supabase.from('providers').update({ profile_image: newProfileImage }).eq('phone', normalizedPhone).select().single();
    return await handleSupabaseRequest(request, "Could not update profile image in database.");
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const supabase = requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase.from('providers').update(details).eq('phone', normalizedPhone).select().single();
    return await handleSupabaseRequest(request, "Could not update provider details.");
}


// ========== AGREEMENTS AND REVIEWS ==========
export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const supabase = requireSupabase();
    const request = supabase.from('reviews').insert([reviewData]).select().single();
    const newReview = await handleSupabaseRequest(request, "Could not add review.");
    await updateProviderRating(reviewData.provider_id);
    return newReview as Review;
}

async function updateProviderRating(providerId: number) {
    const supabase = requireSupabase();
    const { data: reviews, error } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
    if (error) return console.error("Could not fetch reviews for rating update:", error.message);
    const reviewsCount = reviews?.length ?? 0;
    const totalRating = reviews?.reduce((acc: number, r: {rating: number}) => acc + r.rating, 0) ?? 0;
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    await handleSupabaseRequest(
      supabase.from('providers').update({ rating: newAverageRating, reviews_count: reviewsCount }).eq('id', providerId), 
      "Could not update provider rating."
    );
}

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    const supabase = requireSupabase();
    const agreementData = { 
        provider_phone: normalizePhoneNumber(provider.phone), 
        customer_phone: normalizePhoneNumber(customer.phone), 
        customer_name: customer.name, 
        status: 'pending' as const 
    };
    const request = supabase.from('agreements').insert([agreementData]).select().single();
    return await handleSupabaseRequest(request, "Error creating agreement.");
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const supabase = requireSupabase();
    const request = supabase.from('agreements').select('*').eq('provider_phone', normalizePhoneNumber(providerPhone)).order('requested_at', { ascending: false });
    return await handleSupabaseRequest(request, "Could not fetch provider agreements.");
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = requireSupabase();
    const request = supabase.from('agreements').select('*').eq('customer_phone', normalizePhoneNumber(customerPhone)).order('requested_at', { ascending: false });
    return await handleSupabaseRequest(request, "Could not fetch customer agreements.");
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = requireSupabase();
    const request = supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single();
    return await handleSupabaseRequest(request, "Could not confirm agreement.");
}
