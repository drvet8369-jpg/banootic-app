
'use client';
// This file will be our Data Access Layer.
// All functions that interact with Supabase will live here.
// The UI components will call these functions instead of directly
// interacting with Supabase. This makes the code cleaner, more testable,
// and easier to maintain or switch data sources in the future.

import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { Provider, Review, Agreement, PortfolioItem, ChatMessage } from './types';
import type { User } from '@/context/AuthContext';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL_HERE') || !supabaseUrl.startsWith('http')) {
  throw new Error("Supabase URL is not configured correctly. Please make sure NEXT_PUBLIC_SUPABASE_URL in your .env file is a valid URL from your Supabase project settings.");
}
if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY_HERE')) {
    throw new Error("Supabase Anon Key is not configured correctly. Please check NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file. It should be the 'anon' public key from your Supabase project's API settings.");
}


// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This data is used only once to seed the database if it's empty.
const defaultProviders: Omit<Provider, 'id' | 'rating' | 'reviewsCount'>[] = [
  // Beauty
  { name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه، استادان', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه، خیابان کاشانی', phone: '09000000013', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', categorySlug: 'beauty', serviceSlug: 'makeup', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
  { name: 'مرکز اپیلاسیون نازی', service: 'اپیلاسیون', location: 'ارومیه، خیابان ورزش', phone: '09000000014', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی.', categorySlug: 'beauty', serviceSlug: 'waxing', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman beautiful' }, portfolio: [] },
  
  // Cooking
  { name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { name: 'شیرینی‌پزی بهار', service: 'کیک و شیرینی', location: 'ارومیه، خیابان کشاورز', phone: '09000000005', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' }, portfolio: [] },
  { name: 'غذای سالم زهرا', service: 'غذای گیاهی', location: 'ارومیه، دانشکده', phone: '09000000006', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'healthy food' }, portfolio: [] },
  { name: 'فینگرفود شیک', service: 'فینگرفود', location: 'ارومیه، عمار', phone: '09000000015', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها.', categorySlug: 'cooking', serviceSlug: 'finger-food', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'party food' }, portfolio: [] },
  { name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه، مولوی', phone: '09000000016', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی.', categorySlug: 'cooking', serviceSlug: 'homemade-bread', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'baker woman' }, portfolio: [] },
  
  // Tailoring
  { name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه، خیابان مدرس', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { name: 'طراحی پروین', service: 'تعمیرات تخصصی لباس', location: 'ارومیه، خیابان امام', phone: '09000000008', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion designer' }, portfolio: [] },
  { name: 'بوتیک افسانه', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان خیام', phone: '09000000009', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion boutique' }, portfolio: [] },
  { name: 'خانه مد آناهیتا', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان حسنی', phone: '09000000018', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'evening dress' }, portfolio: [] },
  
  // Handicrafts
  { name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه، خیابان بهار', phone: '09000000011', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { name: 'بافتنی صبا', service: 'بافتنی‌ها', location: 'ارومیه، بازار', phone: '09000000012', bio: 'انواع لباس‌ها و وسایل بافتنی دستباف.', categorySlug: 'handicrafts', serviceSlug: 'termeh-kilim', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'knitting craft' }, portfolio: [] },
  { name: 'هنر چرم لیلا', service: 'چرم‌دوزی', location: 'ارومیه، همافر', phone: '09000000019', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص.', categorySlug: 'handicrafts', serviceSlug: 'leather-crafts', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'leather goods' }, portfolio: [] },
  { name: 'کارگاه شمع‌سازی رویا', service: 'شمع‌سازی', location: 'ارومیه، مدنی', phone: '09000000020', bio: 'انواع شمع‌های معطر و صابون‌های گیاهی دست‌ساز.', categorySlug: 'handicrafts', serviceSlug: 'candles-soaps', profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'candle maker' }, portfolio: [] },
];


// Helper function to map Supabase provider record to our Provider type
const mapToProvider = (p: any): Provider => ({
    id: p.id,
    name: p.name,
    service: p.service,
    location: p.location,
    phone: p.phone,
    bio: p.bio,
    categorySlug: p.category_slug,
    serviceSlug: p.service_slug,
    rating: p.rating,
    reviewsCount: p.reviews_count,
    profileImage: p.profile_image || { src: '', aiHint: 'woman portrait' },
    portfolio: p.portfolio || [],
});


/**
 * Seeds the initial provider data from the local `data.ts` file into the Supabase table.
 * This is intended to be a one-time operation.
 * @returns {Promise<Provider[]>} The list of providers that were inserted.
 */
async function seedInitialProviders(): Promise<Provider[]> {
    console.log("Seeding initial provider data to Supabase...");
    
    // We need to map our local data to match the Supabase table schema
    const dataToInsert = defaultProviders.map(p => ({
        // We don't insert 'id' because it's auto-generated by the database
        name: p.name,
        service: p.service,
        location: p.location,
        phone: p.phone,
        bio: p.bio,
        category_slug: p.categorySlug,
        service_slug: p.serviceSlug,
        profile_image: p.profileImage,
        portfolio: p.portfolio,
    }));

    const { data, error } = await supabase
        .from('providers')
        .insert(dataToInsert)
        .select();

    if (error) {
        console.error("Error seeding providers:", error);
        throw new Error("Could not seed initial provider data.");
    }
    
    console.log("Seeding successful!");
    return data.map(mapToProvider);
}


/**
 * Fetches all service providers.
 * If the providers table is empty, it seeds the initial data first.
 * @returns {Promise<Provider[]>} A list of all providers.
 */
export async function getAllProviders(): Promise<Provider[]> {
  const { count, error: countError } = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true });

  if(countError){
      console.error("Error counting providers:", countError);
      throw new Error("Could not check for existing providers.");
  }
  
  if (count === 0) {
      console.log("No providers found. Seeding initial data...");
      return await seedInitialProviders();
  }

  const { data, error } = await supabase
    .from('providers')
    .select('*');

  if (error) {
    console.error("Error fetching providers:", error);
    throw new Error("Could not fetch providers.");
  }

  return data.map(mapToProvider);
}

/**
 * Creates a new provider in the database.
 * @param {Omit<Provider, 'id'>} providerData The data for the new provider.
 * @returns {Promise<Provider>} The newly created provider.
 */
export async function createProvider(providerData: Omit<Provider, 'id'|'rating'|'reviewsCount'>): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .insert({
            name: providerData.name,
            service: providerData.service,
            location: providerData.location,
            phone: providerData.phone,
            bio: providerData.bio,
            category_slug: providerData.categorySlug,
            service_slug: providerData.serviceSlug,
            rating: 0,
            reviews_count: 0,
            profile_image: providerData.profileImage,
            portfolio: providerData.portfolio,
        })
        .select()
        .single(); // Use single to get the created object back

    if (error) {
        console.error("Error creating provider:", error);
        throw new Error(error.message); // Throw the actual Supabase error
    }

    return mapToProvider(data);
}


/**
 * Fetches a single provider by their phone number.
 * @param {string} phone The provider's phone number.
 * @returns {Promise<Provider | null>} The provider object or null if not found.
 */
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('phone', phone)
        .single(); // .single() returns one record or null, and errors if more than one is found.

    if (error && error.code !== 'PGRST116') { // PGRST116 is the code for "No rows found"
        console.error("Error fetching provider by phone:", error);
        throw new Error("Could not fetch provider.");
    }

    if (!data) return null;
    
    return mapToProvider(data);
}

/**
 * Updates a provider's main details.
 * @param {string} phone The provider's phone number to identify them.
 * @param {object} detailsToUpdate An object with the fields to update.
 * @returns {Promise<Provider>} The updated provider object.
 */
export async function updateProviderDetails(phone: string, detailsToUpdate: { name: string; service: string; bio: string; }): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update(detailsToUpdate)
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error updating provider details:", error);
        throw new Error("Could not update provider's details.");
    }
    
    return mapToProvider(data);
}

/**
 * Updates a provider's portfolio items.
 * @param {string} phone The provider's phone number to identify them.
 * @param {PortfolioItem[]} portfolio The new array of portfolio items.
 * @returns {Promise<Provider>} The updated provider object.
 */
export async function updateProviderPortfolio(phone: string, portfolio: PortfolioItem[]): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: portfolio })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error updating portfolio:", error);
        throw new Error("Could not update provider's portfolio.");
    }
    
    return mapToProvider(data);
}

/**
 * Updates a provider's profile image.
 * @param {string} phone The provider's phone number to identify them.
 * @param {PortfolioItem} profileImage The new profile image object.
 * @returns {Promise<Provider>} The updated provider object.
 */
export async function updateProviderProfileImage(phone: string, profileImage: PortfolioItem): Promise<Provider> {
    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: profileImage })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error("Error updating profile image:", error);
        throw new Error("Could not update provider's profile image.");
    }
    
    return mapToProvider(data);
}


/**
 * Fetches all reviews for a specific provider ID.
 * @param {number} providerId The ID of the provider.
 * @returns {Promise<Review[]>} A list of reviews for the provider.
 */
export async function getReviewsByProviderId(providerId: number): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching reviews:", error);
        throw new Error("Could not fetch reviews.");
    }

    return data.map(r => ({
        id: r.id,
        providerId: r.provider_id,
        authorName: r.author_name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
    }));
}

type NewReview = Omit<Review, 'id' | 'createdAt'>;

/**
 * Adds a new review to the database and updates the provider's average rating.
 * @param {NewReview} review The new review object.
 * @returns {Promise<Review>} The newly created review.
 */
export async function addReview(review: NewReview): Promise<Review> {
    // 1. Insert the new review
    const { data: newReviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
            provider_id: review.providerId,
            author_name: review.authorName,
            rating: review.rating,
            comment: review.comment,
        })
        .select()
        .single();

    if (reviewError) {
        console.error("Error adding review:", reviewError);
        throw new Error("Could not add review.");
    }
    
    // 2. Recalculate the provider's average rating
    const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', review.providerId);
        
    if(reviewsError){
         console.error("Error fetching reviews for rating update:", reviewsError);
         // We don't throw here because the review was already added successfully.
         // We can just return the new review and log the error.
    } else {
        const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
        const reviewsCount = reviews.length;
        const newAverageRating = parseFloat((totalRating / reviewsCount).toFixed(1));

        // 3. Update the provider's record
        const { error: providerUpdateError } = await supabase
            .from('providers')
            .update({ rating: newAverageRating, reviews_count: reviewsCount })
            .eq('id', review.providerId);
            
        if(providerUpdateError){
            console.error("Error updating provider rating:", providerUpdateError);
        }
    }
    
    return {
        id: newReviewData.id,
        providerId: newReviewData.provider_id,
        authorName: newReviewData.author_name,
        rating: newReviewData.rating,
        comment: newReviewData.comment,
        createdAt: newReviewData.created_at,
    };
}


// ----- Agreements -----

const mapToAgreement = (a: any): Agreement => ({
  id: a.id,
  providerPhone: a.provider_phone,
  customerPhone: a.customer_phone,
  customerName: a.customer_name,
  status: a.status,
  requestedAt: a.requested_at,
  confirmedAt: a.confirmed_at,
});


/**
 * Creates a new agreement request in the database.
 * @param {Provider} provider The provider the request is for.
 * @param {User} customer The customer making the request.
 * @returns {Promise<Agreement>} The newly created agreement.
 */
export async function createAgreement(provider: Provider, customer: User): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .insert({
      provider_phone: provider.phone,
      customer_phone: customer.phone,
      customer_name: customer.name,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating agreement:", error);
    throw new Error("Could not create agreement.");
  }
  return mapToAgreement(data);
}

/**
 * Fetches all agreements for a specific provider.
 * @param {string} phone The provider's phone number.
 * @returns {Promise<Agreement[]>} A list of agreements.
 */
export async function getAgreementsByProvider(phone: string): Promise<Agreement[]> {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('provider_phone', phone)
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching agreements for provider:', error);
    throw new Error('Could not fetch agreements.');
  }

  return data.map(mapToAgreement);
}

/**
 * Fetches all agreements for a specific customer.
 * @param {string} phone The customer's phone number.
 * @returns {Promise<Agreement[]>} A list of agreements.
 */
export async function getAgreementsByCustomer(phone: string): Promise<Agreement[]> {
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('customer_phone', phone)
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching agreements for customer:', error);
    throw new Error('Could not fetch agreements.');
  }

  return data.map(mapToAgreement);
}

/**
 * Updates an agreement's status to 'confirmed'.
 * @param {number} agreementId The ID of the agreement to update.
 * @returns {Promise<Agreement>} The updated agreement object.
 */
export async function confirmAgreement(agreementId: number): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', agreementId)
    .select()
    .single();

  if (error) {
    console.error('Error confirming agreement:', error);
    throw new Error('Could not confirm agreement.');
  }
  return mapToAgreement(data);
}


// ----- Customer Data (localStorage) -----
const CUSTOMERS_STORAGE_KEY = 'banotic-customers';
export const getCustomers = async (): Promise<User[]> => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const saveCustomers = async (customers: User[]): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    } catch (e) {
        console.error("Failed to save customers to localStorage", e);
    }
};

// ----- Real-time Chat -----

type NewMessagePayload = Omit<ChatMessage, 'id' | 'created_at' | 'is_edited'>;

/**
 * Sends a new chat message to the database.
 * @param {NewMessagePayload} message The message payload.
 */
export async function sendMessage(message: NewMessagePayload) {
  const { error } = await supabase.from('messages').insert(message);
  if (error) {
    console.error("Error sending message:", error);
    throw new Error("Could not send message.");
  }
}

/**
 * Gets the total number of unread messages for a user.
 * This is a reliable client-side implementation that queries the table directly.
 * @param {string} userPhone The phone number of the user.
 * @returns {Promise<number>} The total count of unread messages.
 */
export async function getUnreadCount(userPhone: string): Promise<number> {
    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userPhone) 
        .like('chat_id', `%${userPhone}%`); 

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
    
    return count || 0;
}


/**
 * Fetches the inbox list for a user.
 * This is a client-side implementation that avoids RPC calls.
 * @param {string} userPhone The phone number of the user.
 * @returns {Promise<any[]>} A list of chat summaries for the inbox.
 */
export async function getInboxList(userPhone: string): Promise<any[]> {
    try {
        // 1. Get all distinct chat_ids the user is part of.
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('chat_id')
            .like('chat_id', `%${userPhone}%`);

        if (messagesError) throw messagesError;
        if (!messages) return [];

        const chatIds = [...new Set(messages.map(m => m.chat_id))];

        // 2. For each chat, fetch the last message and other member's details.
        const chatList = await Promise.all(
            chatIds.map(async (chatId) => {
                // Get the other member's phone number from the chat_id
                const members = chatId.split('__');
                const otherMemberId = members.find(id => id !== userPhone);
                if (!otherMemberId) return null;

                // Get the last message in the chat
                const { data: lastMessageData, error: lastMessageError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chat_id', chatId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (lastMessageError && lastMessageError.code !== 'PGRST116') { // Ignore "No rows found" error
                    console.error(`Error getting last message for chat ${chatId}:`, lastMessageError);
                    return null;
                }
                
                // Get unread count for this specific chat
                 const { count: unreadCount, error: unreadError } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('chat_id', chatId)
                    .eq('is_read', false)
                    .neq('sender_id', userPhone);
                    
                if (unreadError) {
                    console.error(`Error getting unread count for chat ${chatId}:`, unreadError);
                }

                // Get the other member's name
                let otherMemberName = `کاربر ${otherMemberId.slice(-4)}`;
                const provider = await getProviderByPhone(otherMemberId);
                if (provider) {
                    otherMemberName = provider.name;
                } else {
                    const customers = await getCustomers();
                    const customer = customers.find(c => c.phone === otherMemberId);
                    if (customer) {
                        otherMemberName = customer.name;
                    }
                }
                
                return {
                    id: chatId,
                    otherMemberId: otherMemberId,
                    otherMemberName: otherMemberName,
                    lastMessage: lastMessageData ? lastMessageData.text : 'هنوز پیامی ارسال نشده',
                    updatedAt: lastMessageData ? lastMessageData.created_at : new Date().toISOString(),
                    unreadCount: unreadCount || 0,
                };
            })
        );
        
        // Filter out any nulls and sort by the most recent message
        return chatList
            .filter((chat): chat is object => chat !== null)
            .sort((a, b) => new Date((b as any).updatedAt).getTime() - new Date((a as any).updatedAt).getTime()) as any[];

    } catch (error) {
        console.error("Error fetching inbox list:", error);
        throw new Error("Could not fetch inbox list.");
    }
}


/**
 * Subscribes to real-time messages for a given chat ID.
 * It also marks messages as read when the chat is opened.
 * @param {string} chatId The ID of the chat to subscribe to.
 * @param {string} currentUserPhone The phone number of the current user.
 * @param {(message: ChatMessage) => void} onNewMessage A callback function to handle new messages.
 * @returns {Promise<{initialMessages: ChatMessage[], channel: RealtimeChannel}>} An object containing the initial messages and the Supabase channel for cleanup.
 */
export async function subscribeToMessages(chatId: string, currentUserPhone: string, onNewMessage: (message: ChatMessage) => void): Promise<{initialMessages: ChatMessage[], channel: RealtimeChannel}> {
  // Mark messages as read upon opening the chat
  const { error: updateError } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', currentUserPhone)
    .eq('is_read', false);

  if (updateError) {
      console.error("Error marking messages as read:", updateError);
  }

  // Fetch initial messages
  const { data: initialMessagesData, error: initialError } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (initialError) {
    console.error("Error fetching initial messages:", initialError);
    throw new Error("Could not fetch initial messages.");
  }
  
  const initialMessages: ChatMessage[] = initialMessagesData || [];
  
  // Set up the real-time subscription
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      async (payload) => {
        const newMessage = payload.new as ChatMessage;
        // If the new message is not from the current user, mark it as read immediately
        if (newMessage.sender_id !== currentUserPhone) {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
        }
        onNewMessage(newMessage);
      }
    )
    .subscribe((status, err) => {
        if(status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to channel: chat:${chatId}`);
        }
        if(status === 'CHANNEL_ERROR') {
            console.error(`Subscription error on channel chat:${chatId}:`, err);
        }
    });

  return { initialMessages, channel };
}
