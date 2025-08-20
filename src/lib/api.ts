
'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { Buffer } from 'buffer';
import { normalizePhoneNumber } from './utils';

// --- Default Data for Development/Fallback ---
const defaultProviders: Provider[] = [
  // This is a sample provider for DEV mode.
  { id: 1, name: 'هنرمند پیش‌فرض', service: 'خدمات نمونه', location: 'ارومیه', phone: '09111111111', bio: 'این یک پروفایل نمونه برای حالت توسعه است.', category_slug: 'beauty', service_slug: 'manicure-pedicure', rating: 5, reviews_count: 1, profileimage: { src: '', aiHint: 'woman portrait' }, portfolio: [] },
];

const defaultCustomers: User[] = [
    // This is a sample customer for DEV mode, for "مژگان جودکی".
    { name: 'مژگان جودکی', phone: '09121111111', accountType: 'customer' }
];


// --- Supabase Client Initialization (Centralized & Robust) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'images';

let supabase: SupabaseClient | null = null;

// Check if the environment variables are actually set and not just placeholders.
const isSupabaseConfigured = 
  supabaseUrl && !supabaseUrl.startsWith("YOUR_") &&
  supabaseKey && !supabaseKey.startsWith("YOUR_");

if (isSupabaseConfigured) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        });
        console.log("Supabase client initialized successfully.");
    } catch (error) {
        console.error("Supabase client creation failed due to invalid URL or key:", error);
        supabase = null; // Ensure supabase is null on failure
    }
} else {
    console.warn(`
  ****************************************************************
  ** WARNING: Supabase environment variables are not set.       **
  **             Falling back to local data mode.               **
  ****************************************************************
  `);
}

// ========== Helper Function for Clean Error Handling ==========
async function handleSupabaseRequest<T>(request: Promise<{ data: T | null; error: any }>, errorMessage: string): Promise<T> {
    if (!supabase) {
        throw new Error("Supabase is not configured. Cannot make a database request.");
    }
    const { data, error } = await request;
    if (error) {
        console.error(`${errorMessage}:`, error);
        throw new Error(`A database error occurred. Details: ${error.message}`);
    }
    return data as T;
}

// ========== NEW UNIFIED LOGIN FUNCTION ==========

export type UserRole = 'customer' | 'provider';

export async function loginUser(phone: string, role: UserRole) {
  const cleanPhone = normalizePhoneNumber(phone);
  const tableName = role === 'provider' ? 'providers' : 'customers';

  // Fallback for DEV mode
  if (!supabase) {
    console.log(`DEV MODE: Attempting to log in ${role} with phone ${cleanPhone} from local data.`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const userList = role === 'provider' ? defaultProviders : defaultCustomers;
    const user = userList.find(u => normalizePhoneNumber(u.phone) === cleanPhone);

    if (user) {
        return { success: true, user: { ...user, accountType: role } };
    }
    return { success: false, message: 'کاربری در حالت توسعه یافت نشد' };
  }

  // Production logic
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('phone', cleanPhone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // "single()" row not found
        console.log(`Login attempt for ${role} with phone ${cleanPhone}: Not found.`);
        return { success: false, message: 'کاربری با این مشخصات یافت نشد' };
    }
    console.error('Supabase login error:', error);
    return { success: false, message: 'خطا در اتصال به پایگاه داده' };
  }

  if (!data) {
    return { success: false, message: 'کاربری یافت نشد' };
  }

  // Ensure the accountType is correctly set for the auth context
  return { success: true, user: { ...data, accountType: role } };
}


// ========== Provider Functions (Kept for other functionalities) ==========

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!supabase) {
        console.log(`DEV MODE: Falling back to local data for provider: ${normalizedPhone}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        return defaultProviders.find(p => normalizePhoneNumber(p.phone) === normalizedPhone) || null;
    }
    
    return handleSupabaseRequest(
        supabase.from('providers').select('*').eq('phone', normalizedPhone).maybeSingle(),
        "Error fetching provider by phone"
    );
}

export async function getAllProviders(): Promise<Provider[]> {
    if (!supabase) return defaultProviders;

    const { data, error } = await supabase.from('providers').select('*').order('name', { ascending: true });
    if(error) {
        console.error("Could not fetch providers.", error);
        return [];
    }
    return data || [];
}

export async function getProvidersByCategory(categorySlug: string): Promise<Provider[]> {
    if (!supabase) {
        return defaultProviders.filter(p => p.category_slug === categorySlug);
    }
     const { data, error } = await supabase.from('providers').select('*').eq('category_slug', categorySlug);
     if(error) {
        console.error("Could not fetch providers for this category.", error);
        return [];
    }
     return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    if (!supabase) {
       return defaultProviders.filter(p => p.service_slug === serviceSlug);
    }
     const { data, error } = await supabase.from('providers').select('*').eq('service_slug', serviceSlug);
     if (error) {
        console.error("Could not fetch providers for this service.", error);
        return [];
     }
     return data || [];
}


export async function createProvider(providerData: Omit<Provider, 'id' | 'rating' | 'reviews_count'>): Promise<Provider> {
    if (!supabase) {
       const newProvider = { 
           id: Date.now(), 
           rating: 0, 
           reviews_count: 0, 
           ...providerData 
        };
       defaultProviders.push(newProvider as any);
       console.log("DEV_MODE: Skipping provider creation, saving to local array.", newProvider);
       return newProvider as any;
    }

    const dataToInsert = {
      ...providerData,
      phone: normalizePhoneNumber(providerData.phone),
    };
    
    const request = supabase.from('providers').insert([{ ...dataToInsert, rating: 0, reviews_count: 0 }]).select().single();
    return handleSupabaseRequest(request, "Error creating provider.");
}


export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
    if (!supabase) {
        console.warn("DEV_MODE: Skipping provider update.");
        const provider = await getProviderByPhone(phone);
        if (!provider) throw new Error("Provider not found in local data for update.");
        return { ...provider, ...details };
    }
    const normalizedPhone = normalizePhoneNumber(phone);
    const request = supabase.from('providers').update(details).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not update provider details.");
}

async function uploadImageFromBase64(base64Data: string, phone: string, folder: 'portfolio' | 'profile'): Promise<string> {
    if (!supabase) {
        console.warn("DEV_MODE: Skipping image upload, returning placeholder.");
        return "https://placehold.co/400x400.png";
    }
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!base64Data) throw new Error("No image data provided for upload.");

    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const base64String = base64Data.split(';base64,').pop();

    if (!base64String) throw new Error('Invalid base64 string');

    const fileBuffer = Buffer.from(base64String, 'base64');
    const filePath = `${normalizedPhone}/${folder}/${Date.now()}.${fileExtension}`;
    
    await handleSupabaseRequest(
        supabase.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, { contentType: mimeType, upsert: true }),
        `Failed to upload image`
    );

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    if (!publicUrlData) throw new Error('Could not get public URL for the uploaded file.');

    return publicUrlData.publicUrl;
}

export async function addPortfolioItem(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    if (!supabase) throw new Error("Cannot add portfolio item: Database not configured");
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = await uploadImageFromBase64(base64Data, normalizedPhone, 'portfolio');
    const newItem: PortfolioItem = { src: imageUrl, aiHint };

    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider) throw new Error("Provider not found to add portfolio item.");

    const updatedPortfolio = [...(currentProvider.portfolio || []), newItem];

    const request = supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not add portfolio item to database.");
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    if (!supabase) throw new Error("Cannot delete portfolio item: Database not configured");
    const normalizedPhone = normalizePhoneNumber(phone);

    const currentProvider = await getProviderByPhone(normalizedPhone);
    if (!currentProvider || !currentProvider.portfolio || !currentProvider.portfolio[itemIndex]) {
        throw new Error("Provider or portfolio item not found.");
    }
    
    const itemToDelete = currentProvider.portfolio[itemIndex];

    if (itemToDelete.src && supabaseUrl && itemToDelete.src.includes(supabaseUrl)) {
        const filePath = itemToDelete.src.split(`${BUCKET_NAME}/`)[1];
        if (filePath) {
            await handleSupabaseRequest(
                supabase.storage.from(BUCKET_NAME).remove([filePath]),
                "Failed to delete image from storage."
            );
        }
    }

    const updatedPortfolio = currentProvider.portfolio.filter((_, index) => index !== itemIndex);

    const request = supabase.from('providers').update({ portfolio: updatedPortfolio }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not delete portfolio item from database.");
}

export async function updateProviderProfileImage(phone: string, base64Data: string, aiHint: string): Promise<Provider> {
    if (!supabase) throw new Error("Cannot update profile image: Database not configured");
    const normalizedPhone = normalizePhoneNumber(phone);
    const imageUrl = base64Data ? await uploadImageFromBase64(base64Data, normalizedPhone, 'profile') : '';
    const newProfileImage: PortfolioItem = { src: imageUrl, aiHint };

    const request = supabase.from('providers').update({ profileimage: newProfileImage }).eq('phone', normalizedPhone).select().single();
    return handleSupabaseRequest(request, "Could not update profile image in database.");
}

// ========== Customer Functions ==========

export async function createCustomer(userData: { name: string, phone: string, account_type: 'customer' }): Promise<User> {
    if (!supabase) {
        console.warn("DEV_MODE: Skipping customer creation, saving to local array.");
        const newCustomer = { ...userData, accountType: 'customer' as const };
        defaultCustomers.push(newCustomer);
        return newCustomer;
    }

    const dataToInsert = {
      ...userData,
      phone: normalizePhoneNumber(userData.phone),
    };
    
    const request = supabase
        .from('customers')
        .insert([dataToInsert])
        .select('name, phone, account_type')
        .single();

    const data = await handleSupabaseRequest(request, 'Could not create customer account.');
    
    return {
      name: data.name,
      phone: data.phone,
      accountType: data.account_type as 'customer' | 'provider'
    };
}

// ========== Review Functions ==========

export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('reviews').select('*').eq('provider_id', providerId).order('created_at', { ascending: false });
    if (error) {
        console.error("Could not fetch reviews.", error);
        return [];
    }
    return data || [];
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (!supabase) {
        console.warn("DEV_MODE: Skipping review creation.");
        return { id: Date.now(), created_at: new Date().toISOString(), ...reviewData };
    }
    
    const request = supabase.from('reviews').insert([reviewData]).select().single();
    const newReview = await handleSupabaseRequest(request, "Could not add review.");
    
    await updateProviderRating(reviewData.provider_id);
    return newReview as Review;
}

async function updateProviderRating(providerId: number) {
    if (!supabase) return;
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
    if (!supabase) {
        console.warn("DEV_MODE: Skipping agreement creation.");
        return { id: Date.now(), provider_phone: provider.phone, customer_phone: customer.phone, customer_name: customer.name, status: 'pending', requested_at: new Date().toISOString() };
    }
    const normalizedProviderPhone = normalizePhoneNumber(provider.phone);
    const normalizedCustomerPhone = normalizePhoneNumber(customer.phone);
    const agreementData = {
        provider_phone: normalizedProviderPhone,
        customer_phone: normalizedCustomerPhone,
        customer_name: customer.name,
        status: 'pending' as const,
    };
    
    const request = supabase.from('agreements').insert([agreementData]).select().single();
    return handleSupabaseRequest(request, "Error creating agreement.");
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    if (!supabase) return [];
    const normalizedPhone = normalizePhoneNumber(providerPhone);
    const { data, error } = await supabase.from('agreements').select('*').eq('provider_phone', normalizedPhone).order('requested_at', { ascending: false });
    if(error) {
        console.error("Could not fetch provider agreements.", error);
        return [];
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    if (!supabase) return [];
    const normalizedPhone = normalizePhoneNumber(customerPhone);
    const { data, error } = await supabase.from('agreements').select('*').eq('customer_phone', normalizedPhone).order('requested_at', { ascending: false });
    if (error) {
        console.error("Could not fetch customer agreements.", error);
        return [];
    }
    return data || [];
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    if (!supabase) {
        console.warn("DEV_MODE: Skipping agreement confirmation.");
        // This is a mock response, may need adjustment based on what the calling code expects
        return { id: agreementId, status: 'confirmed' } as Agreement;
    }
    const request = supabase.from('agreements').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', agreementId).select().single();
    return handleSupabaseRequest(request, "Could not confirm agreement.");
}
