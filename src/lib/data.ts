import 'server-only';
import { createClient } from './supabase/server';
import type { Provider, Review } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import { mockProviders, mockReviews } from './mock-data';

// The query object now accepts slugs, which are more robust.
interface ProviderQuery {
    categorySlug?: string;
    serviceSlug?: string;
    searchQuery?: string;
}

/**
 * Fetches provider data from Supabase, combining 'providers' and 'profiles' tables.
 * This is the single source of truth for fetching lists of providers.
 * If NEXT_PUBLIC_USE_MOCK_DATA is true, it returns sorted and filtered mock data.
 * @param query - Optional filtering object for category, service, or search.
 * @returns A promise that resolves to an array of Provider objects.
 */
export async function getProviders(query: ProviderQuery = {}): Promise<Provider[]> {
    noStore(); // Opt-out of caching for this dynamic data

    // --- MOCK DATA MODE ---
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log("--- Using Mock Data ---");
        let filteredProviders = [...mockProviders];

        if (query.serviceSlug) {
            filteredProviders = filteredProviders.filter(p => p.serviceSlug === query.serviceSlug);
        }
        if (query.categorySlug) {
            filteredProviders = filteredProviders.filter(p => p.categorySlug === query.categorySlug);
        }
        if (query.searchQuery) {
            const cleanedQuery = query.searchQuery.toLowerCase().trim();
            filteredProviders = filteredProviders.filter(p => 
                p.name.toLowerCase().includes(cleanedQuery) ||
                p.service.toLowerCase().includes(cleanedQuery) ||
                p.bio.toLowerCase().includes(cleanedQuery)
            );
        }

        // Apply sorting
        return filteredProviders.sort((a, b) => {
            // 1. Last Activity
            const dateA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
            const dateB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
            if (dateA !== dateB) return dateB - dateA;

            // 2. Rating
            if (a.rating !== b.rating) return b.rating - a.rating;

            // 3. Reviews Count
            if (a.reviewsCount !== b.reviewsCount) return b.reviewsCount - a.reviewsCount;

            // 4. Agreements Count
            return b.agreements_count - a.agreements_count;
        });
    }

    // --- LIVE DATA MODE ---
    const supabase = createClient();
    let queryBuilder = supabase
        .from('providers')
        .select(`
            id,
            profile_id,
            name,
            service,
            location,
            phone,
            bio,
            category_slug,
            service_slug,
            rating,
            reviews_count,
            agreements_count,
            last_activity_at,
            profiles (
                profile_image_url,
                portfolio
            )
        `);

    if (query.serviceSlug) {
        queryBuilder = queryBuilder.eq('service_slug', query.serviceSlug);
    }
    if (query.categorySlug) {
        queryBuilder = queryBuilder.eq('category_slug', query.categorySlug);
    }
    if (query.searchQuery) {
        const cleanedQuery = query.searchQuery.trim();
        queryBuilder = queryBuilder.or(`name.fts.${cleanedQuery},service.fts.${cleanedQuery},bio.fts.${cleanedQuery}`);
    }

    queryBuilder = queryBuilder
        .order('last_activity_at', { ascending: false, nullsLast: true })
        .order('rating', { ascending: false })
        .order('reviews_count', { ascending: false })
        .order('agreements_count', { ascending: false });

    const { data: providersData, error } = await queryBuilder;

    if (error) {
        console.error("Supabase error fetching providers:", error);
        return [];
    }

    const providers: Provider[] = providersData.map(p => {
        const profileData = p.profiles;
        return {
            id: p.id,
            profile_id: p.profile_id,
            name: p.name,
            service: p.service,
            location: p.location,
            phone: p.phone,
            bio: p.bio,
            categorySlug: p.category_slug,
            serviceSlug: p.service_slug,
            rating: p.rating ?? 0,
            reviewsCount: p.reviews_count ?? 0,
            agreements_count: p.agreements_count ?? 0,
            last_activity_at: p.last_activity_at,
            profileImage: {
                src: profileData?.profile_image_url ?? '',
                aiHint: 'woman portrait'
            },
            portfolio: Array.isArray(profileData?.portfolio) ? profileData.portfolio : []
        };
    });

    return providers;
}

/**
 * Fetches a single provider by their phone number.
 * If mock mode is on, it returns a provider from the mock list.
 * @param phone - The phone number of the provider to fetch.
 * @returns A promise that resolves to a Provider object or null if not found.
 */
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    noStore();
    
    // --- MOCK DATA MODE ---
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const provider = mockProviders.find(p => p.phone === phone) || null;
        return Promise.resolve(provider);
    }

    // --- LIVE DATA MODE ---
    const supabase = createClient();
    const { data, error } = await supabase
        .from('providers')
        .select(`
            *,
            profiles (
                profile_image_url,
                portfolio
            )
        `)
        .eq('phone', phone)
        .single();

    if (error || !data) {
        console.error(`Error fetching provider by phone ${phone}:`, error);
        return null;
    }
    
    const profileData = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

    return {
        id: data.id,
        profile_id: data.profile_id,
        name: data.name,
        service: data.service,
        location: data.location,
        phone: data.phone,
        bio: data.bio,
        categorySlug: data.category_slug,
        serviceSlug: data.service_slug,
        rating: data.rating ?? 0,
        reviewsCount: data.reviews_count ?? 0,
        agreements_count: data.agreements_count ?? 0,
        last_activity_at: data.last_activity_at,
        profileImage: {
            src: profileData?.profile_image_url ?? '',
            aiHint: 'woman portrait'
        },
        portfolio: Array.isArray(profileData?.portfolio) ? profileData.portfolio : []
    };
}

/**
 * Fetches all reviews for a specific provider profile.
 * If mock mode is on, it returns reviews from the mock list.
 * @param profileId - The UUID of the provider's profile.
 * @returns A promise that resolves to an array of Review objects.
 */
export async function getReviewsForProvider(profileId: string): Promise<Review[]> {
    noStore();
    
    // --- MOCK DATA MODE ---
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const provider = mockProviders.find(p => p.profile_id === profileId);
        if(!provider) return Promise.resolve([]);
        const reviews = mockReviews.filter(r => r.provider_id === provider.profile_id);
        return Promise.resolve(reviews);
    }

    // --- LIVE DATA MODE ---
    const supabase = createClient();
    const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
            *,
            author:profiles!reviews_author_id_fkey ( full_name )
        `)
        .eq('provider_id', profileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Error fetching reviews for provider ${profileId}:`, error);
        return [];
    }

    return reviewsData.map((r: any) => ({
        id: r.id,
        provider_id: r.provider_id,
        author_id: r.author_id,
        authorName: r.author?.full_name || 'کاربر حذف شده',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
    }));
}
