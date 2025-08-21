'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';
import { normalizePhoneNumber } from './utils';

// --- Default Data for DEV MODE ---
const defaultProviders: Provider[] = [
  // Using phone numbers that are easy to test with
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09122222222', bio: 'متخصص در طراحی و هنر ناخن مدرن.', category_slug: 'beauty', service_slug: 'manicure-pedicure', rating: 4.8, reviews_count: 45, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', category_slug: 'beauty', service_slug: 'haircut-coloring', rating: 4.9, reviews_count: 62, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
];
const defaultCustomers: User[] = [
    { name: 'مژگان جودکی', phone: '09121111111', accountType: 'customer' },
    { name: 'کاربر تستی', phone: '09123456789', accountType: 'customer' },
];


// --- Supabase Client Initialization ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'images';

let supabase: SupabaseClient | null = null;
const isSupabaseConfigured = supabaseUrl && !supabaseUrl.startsWith("YOUR_") && supabaseKey && !supabaseKey.startsWith("YOUR_");

if (isSupabaseConfigured) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    } catch (error) {
        console.error("Supabase client creation failed, will use local data.", error);
        supabase = null;
    }
} else {
    console.warn("Supabase is not configured. The app will run in DEV MODE using local data.");
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
// --- ROBUST LOGIN & USER CHECK FUNCTIONS (FINAL VERSION) ---
// ====================================================================

export async function loginUser(phone: string, role: UserRole): Promise<{ success: boolean; user?: User; message?: string }> {
    const cleanPhone = normalizePhoneNumber(phone);

    const useLocalData = () => {
        console.warn(`DEV_MODE: Attempting login for ${role} with phone ${cleanPhone} using local data.`);
        let foundUser: User | Provider | undefined;
        if (role === 'provider') {
            foundUser = defaultProviders.find(p => normalizePhoneNumber(p.phone) === cleanPhone);
        } else {
            foundUser = defaultCustomers.find(c => normalizePhoneNumber(c.phone) === cleanPhone);
        }

        if (foundUser) {
            return { success: true, user: { ...foundUser, accountType: role } };
        } else {
            return { success: false, message: 'کاربری یافت نشد' };
        }
    };
    
    if (!supabase) {
        return useLocalData();
    }

    try {
        const tableName = role === 'provider' ? 'providers' : 'customers';
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // "0 rows returned"
                 console.warn(`Supabase login failed for ${role} ${cleanPhone}, user not found in DB. Falling back to local data.`);
                 return useLocalData();
            }
            throw error;
        }
        
        return { success: true, user: { ...data, accountType: role } };

    } catch (e) {
        console.error("Supabase request failed during login. Falling back to local data.", e);
        return useLocalData();
    }
}


export async function checkIfUserExists(phone: string): Promise<boolean> {
    const cleanPhone = normalizePhoneNumber(phone);

    const useLocalData = () => {
        console.warn("DEV_MODE: Using local fallback for user existence check.");
        const providerExists = defaultProviders.some(p => normalizePhoneNumber(p.phone) === cleanPhone);
        const customerExists = defaultCustomers.some(c => normalizePhoneNumber(c.phone) === cleanPhone);
        return providerExists || customerExists;
    };
    
    if (!supabase) {
        return useLocalData();
    }

    try {
        const [providerRes, customerRes] = await Promise.all([
            supabase.from('providers').select('id', { count: 'exact', head: true }).eq('phone', cleanPhone),
            supabase.from('customers').select('id', { count: 'exact', head: true }).eq('phone', cleanPhone)
        ]);

        if (providerRes.error || customerRes.error) {
           throw new Error("DB error checking user existence");
        }

        return (providerRes.count ?? 0) > 0 || (customerRes.count ?? 0) > 0;
    } catch(e) {
        console.error("Supabase connection failed during user check. Falling back to local data.", e);
        return useLocalData();
    }
}


// ========== OTHER API FUNCTIONS ==========

export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    const useLocalData = () => {
       const newProvider = { id: Date.now(), rating: 0, reviews_count: 0, ...providerData };
       defaultProviders.push(newProvider as Provider);
       return newProvider as Provider;
    };
    if (!supabase) return useLocalData();

    try {
        const dataToInsert = { ...providerData, phone: normalizePhoneNumber(providerData.phone) };
        const request = supabase.from('providers').insert([{ ...dataToInsert, rating: 0, reviews_count: 0 }]).select().single();
        return await handleSupabaseRequest(request, "Error creating provider.");
    } catch(e) {
        return useLocalData();
    }
}

export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    const useLocalData = () => {
        const newCustomer = { ...userData, accountType: 'customer' } as User;
        defaultCustomers.push(newCustomer);
        return newCustomer;
    };
    if (!supabase) return useLocalData();
    
    try {
        const dataToInsert = { ...userData, phone: normalizePhoneNumber(userData.phone) };
        const request = supabase.from('customers').insert([dataToInsert]).select('name, phone, account_type').single();
        const data = await handleSupabaseRequest(request, 'Could not create customer account.');
        return { name: data.name, phone: data.phone, accountType: data.account_type as 'customer' };
    } catch(e) {
        return useLocalData();
    }
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const normalizedPhone = normalizePhoneNumber(phone);
    const useLocalData = () => defaultProviders.find(p => normalizePhoneNumber(p.phone) === normalizedPhone) || null;
    if (!supabase) return useLocalData();
    try {
         return await handleSupabaseRequest(
            supabase.from('providers').select('*').eq('phone', normalizedPhone).maybeSingle(),
            "Error fetching provider by phone"
        );
    } catch (e) {
        return useLocalData();
    }
}

export async function getAllProviders(): Promise<Provider[]> {
    if (!supabase) return defaultProviders;
    try {
        return await handleSupabaseRequest(supabase.from('providers').select('*').order('name', { ascending: true }), "Could not fetch providers.");
    } catch(e) {
        return defaultProviders;
    }
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    if (!supabase) return defaultProviders.filter(p => p.category_slug === categorySlug);
    try {
        return await handleSupabaseRequest(supabase.from('providers').select('*').eq('category_slug', categorySlug), "Could not fetch providers for this category.");
    } catch(e) {
        return defaultProviders.filter(p => p.category_slug === categorySlug);
    }
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    if (!supabase) return defaultProviders.filter(p => p.service_slug === serviceSlug);
     try {
        return await handleSupabaseRequest(supabase.from('providers').select('*').eq('service_slug', serviceSlug), "Could not fetch providers for this service.");
    } catch(e) {
        return defaultProviders.filter(p => p.service_slug === serviceSlug);
    }
}

// Functions that require a database connection and don't have a simple local fallback
// will throw an error if Supabase is not configured.

const requireSupabase = () => {
    if (!supabase) throw new Error("This action requires a configured Supabase database and cannot be performed in local DEV MODE.");
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase!.from('providers').update(details).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not update provider details.");
}

async function uploadImageFromBase64(base64Data: string, phone: string, folder: 'portfolio' | 'profile'): Promise<string> {
    requireSupabase();
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
    requireSupabase();
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
    requireSupabase();
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
    requireSupabase();
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = base64Data ? await uploadImageFromBase64(base64Data, normalizedPhone, 'profile') : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };
    const request = supabase!.from('providers').update({ profileimage: newProfileImage }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not update profile image in database.");
}

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    if (!supabase) return [];
    try {
        return await handleSupabaseRequest(supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }), "Could not fetch reviews.");
    } catch(e) {
        return [];
    }
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    requireSupabase();
    const request = supabase!.from('reviews').insert([reviewData]).select().single();
    const newReview = await handleSupabaseRequest(request, "Could not add review.");
    await updateProviderRating(reviewData.provider_id);
    return newReview as Review;
}

async function updateProviderRating(providerId: number) {
    requireSupabase();
    const { data: reviews, error } = await supabase!.from('reviews').select('rating').eq('provider_id', providerId);
    if (error || !reviews) return console.error("Could not fetch reviews for rating update.", error?.message);
    const reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc: number, r: {rating: number}) => acc + r.rating, 0);
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    await handleSupabaseRequest(supabase!.from('providers').update({ rating: newAverageRating, reviews_count: reviewsCount }).eq('id', providerId), "Could not update provider rating.");
}

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    requireSupabase();
    const agreementData = { provider_phone: normalizePhoneNumber(provider.phone), customer_phone: normalizePhoneNumber(customer.phone), customer_name: customer.name, status: 'pending' as const };
    const request = supabase!.from('agreements').insert([agreementData]).select().single();
    return handleSupabaseRequest(request, "Error creating agreement.");
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    if (!supabase) return [];
    try {
        return await handleSupabaseRequest(supabase.from('agreements').select('*').eq('provider_phone', normalizePhoneNumber(providerPhone)).order('requested_at', { ascending: false }), "Could not fetch provider agreements.");
    } catch(e) {
        return [];
    }
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    if (!supabase) return [];
     try {
        return await handleSupabaseRequest(supabase.from('agreements').select('*').eq('customer_phone', normalizePhoneNumber(customerPhone)).order('requested_at', { ascending: false }), "Could not fetch customer agreements.");
    } catch(e) {
        return [];
    }
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    requireSupabase();
    const request = supabase!.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single();
    return handleSupabaseRequest(request, "Could not confirm agreement.");
}
