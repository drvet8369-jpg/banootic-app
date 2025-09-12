
// src/lib/data.ts
'use server';
import { createClient } from './supabase/server';
import type { Category, Profile, Review, Service } from './types';

/**
 * Fetches all categories from the database.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
}

/**
 * Fetches a single category by its slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single();
    if(error){
        console.error(`Error fetching category with slug ${slug}:`, error);
        return null;
    }
    return data;
}


/**
 * Fetches all services for a given category slug.
 */
export async function getServicesByCategory(categorySlug: string): Promise<Service[]> {
  const supabase = createClient();
  const { data: category, error: catError } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
  
  if (catError || !category) {
      console.error('Error fetching category for services:', catError);
      return [];
  }

  const { data, error } = await supabase.from('services').select('*').eq('category_id', category.id);
  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }
  return data;
}

/**
 * Fetches a single service by its slug and its category slug.
 */
export async function getServiceBySlug(categorySlug: string, serviceSlug: string): Promise<Service | null> {
    const supabase = createClient();
    // We need to join to check the category slug
    const { data, error } = await supabase
        .from('services')
        .select('*, categories(slug)')
        .eq('slug', serviceSlug)
        .single();
    
    // @ts-ignore
    if (error || !data || data.categories.slug !== categorySlug) {
        console.error(`Error fetching service ${serviceSlug} in category ${categorySlug}:`, error);
        return null;
    }
    return data as Service;
}


/**
 * Fetches all providers who offer a specific service.
 */
export async function getProvidersByService(serviceSlug: string): Promise<Profile[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            category:categories(name),
            service:services(name)
        `)
        .eq('service_slug', serviceSlug)
        .eq('account_type', 'provider');

    if (error) {
        console.error('Error fetching providers by service:', error);
        return [];
    }

    // Manual mapping because Supabase join syntax is tricky with types
    return data.map(p => ({
      ...p,
      // @ts-ignore
      category_name: p.category?.name,
      // @ts-ignore
      service_name: p.service?.name,
    }));
}


/**
 * Searches for providers based on a query.
 */
export async function searchProviders(query: string): Promise<Profile[]> {
    const supabase = createClient();
    if (!query) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            category:categories(name),
            service:services(name)
        `)
        .eq('account_type', 'provider')
        .textSearch('fts', query, { type: 'websearch', config: 'english' }); // Using 'english' config for broader matching

    if (error) {
        console.error('Error searching providers:', error);
        return [];
    }
    
     return data.map(p => ({
      ...p,
      // @ts-ignore
      category_name: p.category?.name,
      // @ts-ignore
      service_name: p.service?.name,
    }));
}


/**
 * Fetches a single provider's public profile by their UUID.
 */
export async function getProviderProfile(providerId: string): Promise<Profile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            bio,
            location,
            phone,
            profile_image_url,
            portfolio_urls,
            rating,
            reviews_count,
            service:services(name),
            category:categories(name)
        `)
        .eq('id', providerId)
        .eq('account_type', 'provider')
        .single();
    
    if (error) {
        console.error(`Error fetching provider profile for ${providerId}:`, error);
        return null;
    }

    return {
      ...data,
      // @ts-ignore
      category_name: data.category?.name,
      // @ts-ignore
      service_name: data.service?.name,
    }
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
