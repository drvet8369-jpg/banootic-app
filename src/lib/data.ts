import 'server-only';
import { createClient } from './supabase/server';
import type { Provider } from './types';
import { unstable_noStore as noStore } from 'next/cache';

interface GetProvidersOptions {
    limit?: number;
    sortBy?: 'last_activity_at' | 'rating' | 'agreements_count';
    categorySlug?: string;
    serviceSlug?: string;
    searchQuery?: string;
    phone?: string;
}

// This is the new, Supabase-powered data fetching function.
export async function getProviders(options: GetProvidersOptions = {}): Promise<Provider[]> {
    noStore(); // Mark this function as dynamic
    const supabase = createClient();
    
    const { 
        limit = 50, 
        sortBy = 'last_activity_at', 
        categorySlug, 
        serviceSlug,
        searchQuery,
        phone
    } = options;

    let query = supabase
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
            profile:profiles!inner(
                profile_image_url,
                portfolio
            )
        `)
        .order(sortBy, { ascending: false, nullsFirst: false })
        .limit(limit);

    if (categorySlug) {
        query = query.eq('category_slug', categorySlug);
    }
    if (serviceSlug) {
        query = query.eq('service_slug', serviceSlug);
    }
    if (phone) {
      query = query.eq('phone', phone);
    }
    if(searchQuery) {
        // Use textSearch for a more powerful and efficient search across multiple columns
        query = query.textSearch('fts', `${searchQuery.split(' ').join(' & ')}`, {
            type: 'websearch',
            config: 'english' // Using english config as it works better for general purpose search
        });
    }

    const { data: providersData, error } = await query;
    
    if (error) {
        console.error("Error fetching providers:", error);
        return [];
    }

    // Map the data to the frontend Provider type
    return providersData.map(p => ({
        id: p.id,
        profile_id: p.profile_id,
        name: p.name,
        service: p.service,
        location: p.location,
        phone: p.phone,
        bio: p.bio,
        categorySlug: p.category_slug,
        serviceSlug: p.service_slug,
        rating: p.rating,
        reviewsCount: p.reviews_count,
        agreements_count: p.agreements_count,
        last_activity_at: p.last_activity_at,
        profileImage: {
            src: p.profile?.profile_image_url || '',
            aiHint: 'woman portrait',
        },
        portfolio: p.profile?.portfolio || [],
    }));
}
