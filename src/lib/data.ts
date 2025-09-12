// src/lib/data.ts
'use server';
import { createClient } from './supabase/server';
import type { Profile, Review, Service, Category } from './types';
import { categories as staticCategories, services as staticServices } from './constants';

/**
 * Fetches all categories from the static constants file.
 */
export async function getCategories(): Promise<Category[]> {
  // This function now returns the complete category objects from the constants file.
  return staticCategories;
}

/**
 * Fetches a single category by its slug from the static constants file.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return staticCategories.find(c => c.slug === slug);
}

/**
 * Fetches all services for a given category slug from the static constants file.
 */
export async function getServicesByCategory(categorySlug: string): Promise<Service[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];
  return staticServices.filter(s => s.category_id === category.id);
}

/**
 * Fetches a single service by its slug and category slug.
 */
export async function getServiceBySlug(categorySlug: string, serviceSlug: string): Promise<Service | undefined> {
    const services = await getServicesByCategory(categorySlug);
    return services.find(s => s.slug === serviceSlug);
}


/**
 * Fetches all providers for a given service slug.
 */
export async function getProvidersByService(serviceSlug: string): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            service:service_slug ( name ),
            category:category_slug ( name )
        `)
        .eq('account_type', 'provider')
        .eq('service_slug', serviceSlug);

    if (error) {
        console.error(`Error fetching providers for service ${serviceSlug}:`, error);
        return [];
    }

    // Map the data to a more usable format
    return data.map(p => ({
        ...p,
        service_name: Array.isArray(p.service) ? p.service[0]?.name : p.service?.name,
        category_name: Array.isArray(p.category) ? p.category[0]?.name : p.category?.name,
    }));
}


/**
 * Fetches a single provider's public profile by their UUID, including related data.
 */
export async function getProviderProfile(providerId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
        id,
        full_name,
        account_type,
        bio,
        location,
        phone,
        profile_image_url,
        portfolio_urls,
        rating,
        reviews_count,
        category:category_slug(name, slug),
        service:service_slug(name, slug)
    `)
    .eq('id', providerId)
    .eq('account_type', 'provider')
    .single();

  if (error) {
    console.error(`Error fetching provider profile for ${providerId}:`, error);
    return null;
  }

  // Flatten the category and service objects
  const profile: Profile = {
      ...data,
      category_name: data.category?.name,
      category_slug: data.category?.slug,
      service_name: data.service?.name,
      service_slug: data.service?.slug,
  };


  return profile;
}

/**
 * Searches for providers based on a query.
 */
export async function searchProviders(query: string): Promise<Profile[]> {
  const supabase = createClient();
  if (!query) return [];

  // `rpc` calls a stored procedure in Supabase. We created `search_providers`.
  const { data, error } = await supabase.rpc('search_providers', { search_term: query });

  if (error) {
    console.error('Error searching providers:', error);
    return [];
  }

  return data as Profile[];
}

/**
 * Fetches all reviews for a given provider.
 */
export async function getReviewsForProvider(providerId: string): Promise<Review[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching reviews for provider ${providerId}:`, error);
    return [];
  }

  return data;
}

/**
 * Creates a new review and updates the provider's average rating.
 */
export async function createReview(
    providerId: string, 
    authorId: string, 
    authorName: string, 
    rating: number, 
    comment: string
) {
    const supabase = createClient();
    
    // Insert the new review
    const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
            provider_id: providerId,
            author_id: authorId,
            author_name: authorName,
            rating: rating,
            comment: comment,
        });

    if (reviewError) {
        console.error('Error creating review:', reviewError);
        return { error: reviewError };
    }

    // After inserting, call the RPC function to recalculate the average
    const { error: rpcError } = await supabase.rpc('update_provider_rating', {
        provider_uuid: providerId
    });

    if (rpcError) {
        // Log this error, but the review was still created, so it's not a full failure.
        console.error('Error updating provider rating:', rpcError);
        // You might want to have a background job to fix inconsistencies later.
    }

    return { success: true };
}