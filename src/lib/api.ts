
'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from './utils';

export type UserRole = 'customer' | 'provider';

// ====================================================================
// --- PRIMARY AUTHENTICATION & CREATION FUNCTIONS ---
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
    const { data, error } = await supabase.from('providers').insert([dataToInsert]).select().single();
    if (error) {
        console.error("Error creating provider:", error.message);
        throw new Error("خطا در ایجاد حساب کاربری هنرمند.");
    }
    return data;
}

export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    const supabase = createServerClient();
    const dataToInsert = { ...userData, phone: normalizePhoneNumber(userData.phone) };
    const { data, error } = await supabase.from('customers').insert([dataToInsert]).select('name, phone, account_type').single();
    
    if (error) {
        console.error('Error creating customer:', error.message);
        throw new Error("خطا در ایجاد حساب کاربری مشتری.");
    }

    return { name: data.name, phone: data.phone, accountType: data.account_type as 'customer' };
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
// --- DATA MODIFICATION FUNCTIONS (REWRITTEN FOR STABILITY) ---
// ====================================================================

async function deleteFileFromStorage(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl || imageUrl.includes('placehold.co')) {
        return; // Do not attempt to delete placeholders
    }

    try {
        const supabase = createServerClient();
        const url = new URL(imageUrl);
        const filePath = url.pathname.split('/images/')[1];

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
    
    // After successfully updating the database, delete the file from storage.
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
        // This handles the deletion case (empty string passed for imageUrl)
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
    
    // After successfully updating the database, delete the old file from storage.
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
