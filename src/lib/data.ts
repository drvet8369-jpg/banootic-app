import 'server-only';
import { createClient } from './supabase/server';
import type { Provider, Review } from './types';
import { unstable_noStore as noStore } from 'next/cache';

// --- NEW: Merit Score Calculation Logic ---

const WEIGHTS = {
  LAST_ACTIVITY: 0.40,
  RATING: 0.35,
  REVIEWS: 0.15,
  AGREEMENTS: 0.10,
};

// Calculates a score from 0 to 1 based on how recent the activity is.
const calculateActivityScore = (lastActivity: string | null): number => {
  if (!lastActivity) return 0;
  const activityDate = new Date(lastActivity);
  const now = new Date();
  const diffHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 24) return 1.0; // Last 24 hours
  if (diffHours <= 72) return 0.9; // Last 3 days
  if (diffHours <= 168) return 0.7; // Last week
  if (diffHours <= 720) return 0.4; // Last 30 days
  return 0.1; // Older than 30 days
};

// Normalizes a value (like review count) based on the max value in the dataset.
const normalizeValue = (value: number, maxValue: number): number => {
  if (maxValue === 0) return 0;
  // Use a logarithmic scale to prevent very high values from dominating.
  return Math.log1p(value) / Math.log1p(maxValue);
};

// The main function to calculate the merit score for a provider
const calculateMeritScore = (provider: Provider, maxReviews: number, maxAgreements: number): number => {
  const activityScore = calculateActivityScore(provider.last_activity_at);
  const ratingScore = (provider.rating || 0) / 5.0;
  const reviewsScore = normalizeValue(provider.reviewsCount || 0, maxReviews);
  const agreementsScore = normalizeValue(provider.agreements_count || 0, maxAgreements);

  const meritScore =
    (activityScore * WEIGHTS.LAST_ACTIVITY) +
    (ratingScore * WEIGHTS.RATING) +
    (reviewsScore * WEIGHTS.REVIEWS) +
    (agreementsScore * WEIGHTS.AGREEMENTS);

  return meritScore;
};
// --- END: Merit Score Calculation Logic ---


interface ProviderQuery {
    categorySlug?: string;
    serviceSlug?: string;
    searchQuery?: string;
}


export async function getProviders(query: ProviderQuery = {}): Promise<Provider[]> {
    noStore(); 

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

    // We no longer sort in the DB, we fetch and then sort in code
    const { data: providersData, error } = await queryBuilder;

    if (error) {
        console.error("Supabase error fetching providers:", error);
        return [];
    }
    
    const mappedProviders: Provider[] = providersData.map(p => {
        const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
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

    // --- NEW: Calculate merit score and sort for live data ---
    const maxReviews = Math.max(...mappedProviders.map(p => p.reviewsCount), 0);
    const maxAgreements = Math.max(...mappedProviders.map(p => p.agreements_count), 0);

    const scoredProviders = mappedProviders.map(provider => ({
        ...provider,
        meritScore: calculateMeritScore(provider, maxReviews, maxAgreements),
    }));

    return scoredProviders.sort((a, b) => b.meritScore - a.meritScore);
}

/**
 * Fetches a single provider by their phone number.
 * @param phone - The phone number of the provider to fetch.
 * @returns A promise that resolves to a Provider object or null if not found.
 */
export async function getProviderByPhone(phone: string): Promise<Provider | null> {
    noStore();
    
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
 * @param profileId - The UUID of the provider's profile.
 * @returns A promise that resolves to an array of Review objects.
 */
export async function getReviewsForProvider(profileId: string): Promise<Review[]> {
    noStore();

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
