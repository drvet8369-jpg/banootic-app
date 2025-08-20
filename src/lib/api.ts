
'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';
import { normalizePhoneNumber } from './utils';

// --- Local Fallback Data ---
// This data is used ONLY when Supabase is not configured.
const defaultProviders: Provider[] = [
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', category_slug: 'beauty', service_slug: 'manicure-pedicure', rating: 4.8, reviews_count: 45, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', category_slug: 'beauty', service_slug: 'haircut-coloring', rating: 4.9, reviews_count: 62, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
];
const defaultCustomers: User[] = [
    { name: 'مژگان جودکی', phone: '09121111111', accountType: 'customer' },
    { name: 'علی رضایی', phone: '09122222222', accountType: 'customer' },
];

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'images';

let supabase: SupabaseClient | null = null;

const isSupabaseConfigured = 
  supabaseUrl && !supabaseUrl.startsWith("YOUR_") &&
  supabaseKey && !supabaseKey.startsWith("YOUR_");

if (isSupabaseConfigured) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    } catch (error) {
        console.error("Supabase client creation failed. Falling back to local data mode.", error);
        supabase = null;
    }
}

async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string): Promise<T> {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await request;
    if (error) {
        console.error(`${errorMessage}:`, error);
        throw new Error(`A database error occurred: ${error.message}`);
    }
    return data as T;
}

export type UserRole = 'customer' | 'provider';

// ====================================================================
// --- THE SINGLE, UNIFIED LOGIN FUNCTION ---
// ====================================================================
export async function loginUser(phone: string, role: UserRole): Promise<{ success: boolean; user?: User; message?: string }> {
    const cleanPhone = normalizePhoneNumber(phone);

    // --- Local Data Fallback Logic ---
    const useLocalData = async () => {
        console.warn(`DEV_MODE: Supabase not configured or connection failed. Using local data for login. Role: ${role}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        let foundUser: User | undefined;
        if (role === 'provider') {
            foundUser = defaultProviders.find(p => normalizePhoneNumber(p.phone) === cleanPhone);
        } else {
            foundUser = defaultCustomers.find(c => normalizePhoneNumber(c.phone) === cleanPhone);
        }

        if (foundUser) {
            return { success: true, user: { ...foundUser, accountType: role } };
        } else {
            return { success: false, message: 'کاربری در حالت توسعه یافت نشد. لطفاً ثبت‌نام کنید.' };
        }
    };
    
    // --- Main Logic ---
    if (!isSupabaseConfigured) {
        return useLocalData();
    }

    try {
        const tableName = role === 'provider' ? 'providers' : 'customers';
        const { data, error } = await supabase!
            .from(tableName)
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // "0 rows returned"
                return { success: false, message: 'کاربری با این مشخصات یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' };
            }
            // For any other DB error, log it and fallback
            console.error(`Supabase login error for role ${role}:`, error);
            throw error; // Let the catch block handle the fallback
        }
        
        return { success: true, user: { ...data, accountType: role } };

    } catch (e) {
        // This catch block handles connection errors or any other thrown errors
        return useLocalData();
    }
}

// ====================================================================
// --- THE SINGLE, UNIFIED USER EXISTENCE CHECK ---
// ====================================================================
export async function checkIfUserExists(phone: string): Promise<boolean> {
    const cleanPhone = normalizePhoneNumber(phone);

    const useLocalData = () => {
        console.warn("DEV_MODE: Supabase not configured or connection failed. Checking local data for user existence.");
        const providerExists = defaultProviders.some(p => normalizePhoneNumber(p.phone) === cleanPhone);
        const customerExists = defaultCustomers.some(c => normalizePhoneNumber(c.phone) === cleanPhone);
        return providerExists || customerExists;
    };
    
    if (!isSupabaseConfigured) {
        return useLocalData();
    }

    try {
        const [providerRes, customerRes] = await Promise.all([
            supabase!.from('providers').select('id', { count: 'exact', head: true }).eq('phone', cleanPhone),
            supabase!.from('customers').select('id', { count: 'exact', head: true }).eq('phone', cleanPhone)
        ]);

        if (providerRes.error || customerRes.error) {
            console.error("Error checking user existence, falling back to local data:", providerRes.error || customerRes.error);
            return useLocalData();
        }

        return (providerRes.count ?? 0) > 0 || (customerRes.count ?? 0) > 0;
    } catch(e) {
        return useLocalData();
    }
}


// ========== OTHER API FUNCTIONS (UNCHANGED LOGIC, JUST USING THE FALLBACK PATTERN) ==========

// Simple helper to decide if we should use local data for a function
const shouldUseLocalData = () => !isSupabaseConfigured;


export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (shouldUseLocalData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return defaultProviders.find(p => normalizePhoneNumber(p.phone) === normalizedPhone) || null;
    }
    return handleSupabaseRequest(
        supabase!.from('providers').select('*').eq('phone', normalizedPhone).maybeSingle(),
        "Error fetching provider by phone"
    );
}

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    if (shouldUseLocalData()) {
       const newProvider = { id: Date.now(), rating: 0, reviews_count: 0, ...providerData };
       console.log("DEV_MODE: Skipping provider creation, returning mock object.", newProvider);
       return newProvider;
    }
    const dataToInsert = { ...providerData, phone: normalizePhoneNumber(providerData.phone) };
    const request = supabase!.from('providers').insert([{ ...dataToInsert, rating: 0, reviews_count: 0 }]).select().single();
    return handleSupabaseRequest(request, "Error creating provider.");
}

export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    if (shouldUseLocalData()) {
        console.warn("DEV_MODE: Skipping customer creation, returning mock object.");
        return { ...userData, accountType: 'customer' };
    }
    const dataToInsert = { ...userData, phone: normalizePhoneNumber(userData.phone) };
    const request = supabase!.from('customers').insert([dataToInsert]).select('name, phone, account_type').single();
    const data = await handleSupabaseRequest(request, 'Could not create customer account.');
    return { name: data.name, phone: data.phone, accountType: data.account_type as 'customer' };
}

// Functions below this line are less critical for login but are kept for completeness.
// They will throw an error if Supabase isn't configured, which is acceptable for now.

export async function getAllProviders(): Promise<Provider[]> {
    if (shouldUseLocalData()) return defaultProviders;
    return handleSupabaseRequest(supabase!.from('providers').select('*').order('name', { ascending: true }), "Could not fetch providers.");
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    if (shouldUseLocalData()) return defaultProviders.filter(p => p.category_slug === categorySlug);
    return handleSupabaseRequest(supabase!.from('providers').select('*').eq('category_slug', categorySlug), "Could not fetch providers for this category.");
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    if (shouldUseLocalData()) return defaultProviders.filter(p => p.service_slug === serviceSlug);
    return handleSupabaseRequest(supabase!.from('providers').select('*').eq('service_slug', serviceSlug), "Could not fetch providers for this service.");
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    if (shouldUseLocalData()) {
        const provider = await getProviderByPhone(phone);
        if (!provider) throw new Error("Provider not found in local data for update.");
        return { ...provider, ...details };
    }
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase!.from('providers').update(details).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not update provider details.");
}

async function uploadImageFromBase64(base64Data: string, phone: string, folder: 'portfolio' | 'profile'): Promise<string> {
    if (shouldUseLocalData()) return "https://placehold.co/400x400.png";
    
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!base64Data) throw new Error("No image data provided for upload.");
    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const base64String = base64Data.split(';base64,').pop();
    if (!base64String) throw new Error('Invalid base64 string');
    const fileBuffer = Buffer.from(base64String, 'base64');
    const filePath = `${normalizedPhone}/${folder}/${Date.now()}.${fileExtension}`;
    
    await handleSupabaseRequest(supabase!.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, { contentType: mimeType, upsert: true }), `Failed to upload image`);
    const { data: publicUrlData } = supabase!.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    if (!publicUrlData) throw new Error('Could not get public URL for the uploaded file.');
    return publicUrlData.publicUrl;
}

export async function addPortfolioItem(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = await uploadImageFromBase64(base64Data, normalizedPhone, 'portfolio');
    const newItem: PortfolioItem = { src: imageUrl, aiHint };
    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider) throw new Error("Provider not found to add portfolio item.");
    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];
    const request = supabase!.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not add portfolio item to database.");
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) throw new Error("Provider or portfolio item not found.");
    const itemToDelete = currentProvider.portfolio[itemIndex];
    if (itemToDelete.src && supabaseUrl && itemToDelete.src.includes(supabaseUrl)) {
        const filePath = itemToDelete.src.split(`${BUCKET_NAME}/`)[1];
        if (filePath) await handleSupabaseRequest(supabase!.storage.from(BUCKET_NAME).remove([filePath]), "Failed to delete image from storage.");
    }
    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);
    const request = supabase!.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not delete portfolio item from database.");
}

export async function updateProviderProfileImage(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = base64Data ? await uploadImageFromBase64(base64Data, normalizedPhone, 'profile') : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };
    const request = supabase!.from('providers').update({ profileimage: newProfileImage }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not update profile image in database.");
}

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    if (shouldUseLocalData()) return [];
    return handleSupabaseRequest(supabase!.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }), "Could not fetch reviews.");
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const request = supabase!.from('reviews').insert([reviewData]).select().single();
    const newReview = await handleSupabaseRequest(request, "Could not add review.");
    await updateProviderRating(reviewData.provider_id);
    return newReview as Review;
}

async function updateProviderRating(providerId: number) {
    if (shouldUseLocalData()) return;
    const { data: reviews, error } = await supabase!.from('reviews').select('rating').eq('provider_id', providerId);
    if (error || !reviews) return console.error("Could not fetch reviews for rating update.", error?.message);
    const reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc: number, r: {rating: number}) => acc + r.rating, 0);
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    await handleSupabaseRequest(supabase!.from('providers').update({ rating: newAverageRating, reviews_count: reviewsCount }).eq('id', providerId), "Could not update provider rating.");
}

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    if (shouldUseLocalData()) return { id: Date.now(), provider_phone: provider.phone, customer_phone: customer.phone, customer_name: customer.name, status: 'pending', requested_at: new Date().toISOString() };
    const agreementData = { provider_phone: normalizePhoneNumber(provider.phone), customer_phone: normalizePhoneNumber(customer.phone), customer_name: customer.name, status: 'pending' as const };
    const request = supabase!.from('agreements').insert([agreementData]).select().single();
    return handleSupabaseRequest(request, "Error creating agreement.");
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    if (shouldUseLocalData()) return [];
    return handleSupabaseRequest(supabase!.from('agreements').select('*').eq('provider_phone', normalizePhoneNumber(providerPhone)).order('requested_at', { ascending: false }), "Could not fetch provider agreements.");
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    if (shouldUseLocalData()) return [];
    return handleSupabaseRequest(supabase!.from('agreements').select('*').eq('customer_phone', normalizePhoneNumber(customerPhone)).order('requested_at', { ascending: false }), "Could not fetch customer agreements.");
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const request = supabase!.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single();
    return handleSupabaseRequest(request, "Could not confirm agreement.");
}
