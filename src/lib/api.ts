
'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from './utils';

// --- Helper Functions ---
async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string): Promise<T> {
    const { data, error } = await request;
    if (error) {
        console.error(`${errorMessage}:`, error.message);
        throw new Error(error.message || 'An unknown Supabase error occurred.');
    }
    return data as T;
}


export type UserRole = 'customer' | 'provider';

// ====================================================================
// --- PRIMARY AUTHENTICATION FUNCTIONS ---
// ====================================================================
export async function loginUser(phone: string, role: UserRole): Promise<{ success: boolean; user?: User; message?: string }> {
    const supabase = createServerClient();
    const cleanPhone = normalizePhoneNumber(phone);
    const tableName = role === 'provider' ? 'providers' : 'customers';

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // "No rows found"
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
    const supabase = createServerClient();
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
export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count' | 'profile_image'>): Promise<Provider> {
    const supabase = createServerClient();
    const dataToInsert = { 
        ...providerData, 
        phone: normalizePhoneNumber(providerData.phone),
        rating: 0, 
        reviews_count: 0,
        profile_image: { src: 'https://placehold.co/400x400.png', ai_hint: 'woman portrait' },
        portfolio: [],
    };
    const request = supabase.from('providers').insert([dataToInsert]).select().single();
    return await handleSupabaseRequest(request, "Error creating provider in database.");
}

export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    const supabase = createServerClient();
    const dataToInsert = { ...userData, phone: normalizePhoneNumber(userData.phone) };
    const request = supabase.from('customers').insert([dataToInsert]).select('name, phone, account_type').single();
    const data = await handleSupabaseRequest(request, 'Could not create customer account.');
    return { name: data.name, phone: data.phone, accountType: data.account_type as 'customer' };
}


// ========== DATA RETRIEVAL FUNCTIONS ==========
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase.from('providers').select('*').eq('phone', normalizedPhone).maybeSingle();
    return await handleSupabaseRequest(request, "Error fetching provider by phone");
}

export async function getAllProviders(): Promise<Provider[]> {
    const supabase = createServerClient();
    const request = supabase.from('providers').select('*').order('name', { ascending: true });
    return await handleSupabaseRequest(request, "Could not fetch providers.");
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    const supabase = createServerClient();
    const request = supabase.from('providers').select('*').eq('category_slug', categorySlug);
    return await handleSupabaseRequest(request, "Could not fetch providers for this category.");
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = createServerClient();
    const request = supabase.from('providers').select('*').eq('service_slug', serviceSlug);
    return await handleSupabaseRequest(request, "Could not fetch providers for this service.");
}

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const supabase = createServerClient();
    const request = supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
    return await handleSupabaseRequest(request, "Could not fetch reviews.");
}


// ========== DATA MODIFICATION FUNCTIONS ==========

export async function addPortfolioItem(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const newItem: PortfolioItem = { src: imageUrl, ai_hint: aiHint };

    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider) throw new Error("Provider not found to add portfolio item.");

    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];
    const request = supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return await handleSupabaseRequest(request, "Could not add portfolio item to database.");
}


export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const currentProvider = await getProviderByPhone(normalizedPhone);

    if (!currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) {
        throw new Error("Provider or portfolio item not found for deletion.");
    }
    
    const itemToDelete = currentProvider.portfolio[itemIndex];
    
    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);
    
    // Optional: Delete the image from storage
    if (itemToDelete.src && !itemToDelete.src.includes('placehold.co')) {
        const path = new URL(itemToDelete.src).pathname.split('/images/')[1];
        if (path) {
            await supabase.storage.from('images').remove([path]);
        }
    }
    
    const request = supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    
    return await handleSupabaseRequest(request, "Could not delete portfolio item from database.");
}

export async function updateProviderProfileImage(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider) throw new Error("Provider not found.");
    
    const oldImageSrc = currentProvider.profile_image?.src;

    const newImageUrl = imageUrl || 'https://placehold.co/400x400.png';
    const newProfileImage: PortfolioItem = { src: newImageUrl, ai_hint: aiHint };

    const request = supabase
        .from('providers')
        .update({ profile_image: newProfileImage })
        .eq('phone', normalizedPhone)
        .select()
        .single();
    
    const updatedProvider = await handleSupabaseRequest(request, "Could not update profile image in database.");
    
    // Optional: Delete the old image from storage if it's not a placeholder
    if (oldImageSrc && !oldImageSrc.includes('placehold.co')) {
        const path = new URL(oldImageSrc).pathname.split('/images/')[1];
        if (path) {
            await supabase.storage.from('images').remove([path]);
        }
    }
    
    return updatedProvider;
}


export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase.from('providers').update(details).eq('phone', normalizedPhone).select().single();
    return await handleSupabaseRequest(request, "Could not update provider details.");
}


// ========== AGREEMENTS AND REVIEWS ==========
export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const supabase = createServerClient();
    const request = supabase.from('reviews').insert([reviewData]).select().single();
    const newReview = await handleSupabaseRequest(request, "Could not add review.");
    await updateProviderRating(reviewData.provider_id);
    return newReview as Review;
}

async function updateProviderRating(providerId: number) {
    const supabase = createServerClient();
    const { data: reviews, error } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
    if (error) {
        console.error("Could not fetch reviews for rating update:", error.message);
        return;
    }
    const reviewsCount = reviews?.length ?? 0;
    const totalRating = reviews?.reduce((acc: number, r: {rating: number}) => acc + r.rating, 0) ?? 0;
    const newAverageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;
    await handleSupabaseRequest(
      supabase.from('providers').update({ rating: newAverageRating, reviews_count: reviewsCount }).eq('id', providerId), 
      "Could not update provider rating."
    );
}

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    const supabase = createServerClient();
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
    const supabase = createServerClient();
    const request = supabase.from('agreements').select('*').eq('provider_phone', normalizePhoneNumber(providerPhone)).order('requested_at', { ascending: false });
    return await handleSupabaseRequest(request, "Could not fetch provider agreements.");
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = createServerClient();
    const request = supabase.from('agreements').select('*').eq('customer_phone', normalizePhoneNumber(customerPhone)).order('requested_at', { ascending: false });
    return await handleSupabaseRequest(request, "Could not fetch customer agreements.");
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = createServerClient();
    const request = supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single();
    return await handleSupabaseRequest(request, "Could not confirm agreement.");
}
