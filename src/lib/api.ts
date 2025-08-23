
'use server';

import { createServerClient } from './supabase/server';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from './utils';
import { createClient } from '@supabase/supabase-js';

// This function is intended to be called from a server component or route handler
// where cookie-based auth is not straightforward. It uses the service role key for elevated privileges.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase server credentials for admin client not found.");
        throw new Error("Server-side admin Supabase credentials are not available.");
    }
    
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};

// ====================================================================
// --- PRIMARY ACCOUNT CREATION FUNCTIONS (Called from Registration form) ---
// ====================================================================

// This function creates a user in the auth.users table but does NOT create a profile.
// It returns the user object, which the client can use to proceed to profile creation.
export async function createAuthUser(phone: string): Promise<{ success: boolean; user?: {id: string}; message?: string }> {
    const supabase = getSupabaseAdmin();
    const cleanPhone = `+98${normalizePhoneNumber(phone).substring(1)}`;

    // Check if user already exists in auth.users
    const { data: existingUser, error: existingUserError } = await supabase.auth.admin.getUserByPhone(cleanPhone);
    if (existingUser?.user) {
        return { success: false, message: 'این شماره تلفن قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.' };
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
        phone: cleanPhone,
        phone_confirm: true, // Auto-confirm phone number since we control this flow
    });

    if (error) {
        console.error(`Auth user creation failed for ${cleanPhone}:`, error.message);
        return { success: false, message: `خطا در ایجاد کاربر: ${error.message}` };
    }
    
    return { success: true, user: data.user };
}


export async function createProviderProfile(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count' | 'profile_image'> & { id: string }): Promise<Provider> {
    const supabase = createServerClient();
    const dataToInsert = { 
        ...providerData, 
        phone: normalizePhoneNumber(providerData.phone),
        rating: 0, 
        reviews_count: 0,
        profile_image: { src: 'https://placehold.co/400x400.png', ai_hint: 'woman portrait' },
        portfolio: [],
    };
    const { data, error } = await supabase.from('providers').insert([dataToInsert]).select().single();
    if (error) {
        console.error("Error creating provider profile:", error.message);
        throw new Error("خطا در ایجاد پروفایل هنرمند.");
    }
    return data;
}

export async function createCustomerProfile(userData: { id: string, name: string, phone: string }): Promise<User> {
    const supabase = createServerClient();
    const dataToInsert = { ...userData, phone: normalizePhoneNumber(userData.phone) };
    const { data, error } = await supabase.from('customers').insert([dataToInsert]).select('id, name, phone').single();
    
    if (error) {
        console.error('Error creating customer profile:', error.message);
        throw new Error("خطا در ایجاد پروفایل مشتری.");
    }

    return { id: data.id, name: data.name, phone: data.phone, accountType: 'customer' };
}

// ====================================================================
// --- DATA RETRIEVAL FUNCTIONS ---
// ====================================================================
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase.from('providers').select('*').eq('phone', normalizedPhone).maybeSingle();
    if (error) {
        console.error("Error fetching provider by phone:", error.message);
        throw new Error("امکان بارگذاری اطلاعات هنرمند وجود ندارد.");
    }
    return data;
}

export async function getAllProviders(): Promise<Provider[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('providers').select('*').order('name', { ascending: true });
    if (error) {
        console.error("Could not fetch providers:", error.message);
        throw new Error("امکان بارگذاری لیست هنرمندان وجود ندارد.");
    }
    return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('providers').select('*').eq('service_slug', serviceSlug);
    if (error) {
        console.error("Could not fetch providers for this service:", error.message);
        throw new Error("امکان بارگذاری لیست هنرمندان برای این سرویس وجود ندارد.");
    }
    return data || [];
}

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
    if (error) {
        console.error("Could not fetch reviews:", error.message);
        throw new Error("امکان بارگذاری نظرات وجود ندارد.");
    }
    return data || [];
}

// ====================================================================
// --- DATA MODIFICATION FUNCTIONS (for authenticated users) ---
// ====================================================================

async function deleteFileFromStorage(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl || imageUrl.includes('placehold.co')) {
        return; 
    }

    try {
        const supabase = createServerClient();
        const url = new URL(imageUrl);
        // Standard Supabase path: /storage/v1/object/public/images/public/user_id/...
        const filePath = decodeURIComponent(url.pathname).split('/images/')[1];

        if (filePath) {
            const { error: storageError } = await supabase.storage.from('images').remove([filePath]);
            if (storageError) {
                console.error("Could not delete file from storage:", storageError.message);
            }
        }
    } catch (e) {
        console.error("Error parsing or deleting file from storage:", e);
    }
}


export async function addPortfolioItem(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error("آدرس تصویر برای افزودن به نمونه کار نامعتبر است.");
    }
    
    const newItem: PortfolioItem = { src: imageUrl, ai_hint: aiHint };

    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', normalizedPhone)
        .single();
    
    if (fetchError || !currentProvider) {
        console.error("AddPortfolioItem - Fetch Error:", fetchError?.message);
        throw new Error("هنرمند برای افزودن نمونه کار یافت نشد.");
    }

    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];
    
    const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (updateError) {
        console.error("AddPortfolioItem - Update Error:", updateError.message);
        throw new Error("خطا در افزودن نمونه کار به پایگاه داده.");
    }
    
    return updatedProvider;
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);

    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', normalizedPhone)
        .single();

    if (fetchError || !currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) {
        console.error("DeletePortfolioItem - Fetch Error:", fetchError?.message);
        throw new Error("هنرمند یا نمونه کار برای حذف یافت نشد.");
    }
    
    const itemToDelete = currentProvider.portfolio[itemIndex];
    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);
    
    const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (updateError) {
        console.error("DeletePortfolioItem - Update Error:", updateError.message);
        throw new Error("خطا در حذف نمونه کار از پایگاه داده.");
    }
    
    await deleteFileFromStorage(itemToDelete?.src);
    
    return updatedProvider;
}

export async function updateProviderProfileImage(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    
    const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('profile_image')
        .eq('phone', normalizedPhone)
        .single();
    
    if (fetchError || !currentProvider) {
        console.error("UpdateProfileImage - Fetch Error:", fetchError?.message);
        throw new Error("هنرمند برای بروزرسانی عکس پروفایل یافت نشد.");
    }
    
    const oldImageSrc = currentProvider.profile_image?.src;
    
    let newProfileImage: PortfolioItem;
    if (imageUrl && imageUrl.startsWith('http')) {
        newProfileImage = { src: imageUrl, ai_hint: aiHint };
    } else {
        newProfileImage = { src: 'https://placehold.co/400x400.png', ai_hint: 'woman portrait' };
    }
    
    const { data: updatedProvider, error: updateError } = await supabase
        .from('providers')
        .update({ profile_image: newProfileImage })
        .eq('phone', normalizedPhone)
        .select()
        .single();

    if (updateError) {
        console.error("UpdateProfileImage - Update Error:", updateError.message);
        throw new Error("خطا در به‌روزرسانی عکس پروفایل در پایگاه داده.");
    }
    
    await deleteFileFromStorage(oldImageSrc);
    
    return updatedProvider;
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    const supabase = createServerClient();
    const normalizedPhone = normalizePhoneNumber(phone);
    const { data, error } = await supabase.from('providers').update(details).eq('phone', normalizedPhone).select().single();
    if (error) {
        console.error("Could not update provider details:", error.message);
        throw new Error("خطا در به‌روزرسانی اطلاعات هنرمند.");
    }
    return data;
}

// ====================================================================
// --- AGREEMENTS AND REVIEWS FUNCTIONS ---
// ====================================================================
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
    
    const { error: updateError } = await supabase.from('providers').update({ rating: newAverageRating, reviews_count: reviewsCount }).eq('id', providerId);
    if (updateError) {
        console.error("Could not update provider rating:", updateError.message);
    }
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('reviews').insert([reviewData]).select().single();
    if (error) {
        console.error("Could not add review:", error.message);
        throw new Error("خطا در ثبت نظر.");
    }
    await updateProviderRating(reviewData.provider_id);
    return data as Review;
}

export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
    const supabase = createServerClient();
    const agreementData = { 
        provider_phone: normalizePhoneNumber(provider.phone), 
        customer_phone: normalizePhoneNumber(customer.phone), 
        customer_name: customer.name, 
        status: 'pending' as const 
    };
    const { data, error } = await supabase.from('agreements').insert([agreementData]).select().single();
    if (error) {
        console.error("Error creating agreement:", error.message);
        if (error.code === '23505') { // Unique constraint violation
             throw new Error("شما قبلاً یک درخواست برای این هنرمند ثبت کرده‌اید.");
        }
        throw new Error("خطا در ایجاد توافق‌نامه.");
    }
    return data;
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('agreements').select('*').eq('provider_phone', normalizePhoneNumber(providerPhone)).order('requested_at', { ascending: false });
     if (error) {
        console.error("Could not fetch provider agreements:", error.message);
        throw new Error("امکان بارگذاری توافق‌های هنرمند وجود ندارد.");
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('agreements').select('*').eq('customer_phone', normalizePhoneNumber(customerPhone)).order('requested_at', { ascending: false });
    if (error) {
        console.error("Could not fetch customer agreements:", error.message);
        throw new Error("امکان بارگذاری درخواست‌های شما وجود ندارد.");
    }
    return data || [];
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single();
    if (error) {
        console.error("Could not confirm agreement:", error.message);
        throw new Error("خطا در تایید توافق‌نامه.");
    }
    return data;
}

