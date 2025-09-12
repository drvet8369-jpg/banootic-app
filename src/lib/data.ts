
// src/lib/data.ts
'use server';
import { createClient } from './supabase/server';
import type { Profile, Review, Service } from './types';

/**
 * Fetches all categories (unique category_slug values from providers)
 */
export async function getCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('providers').select('category_slug');

  if (error) {
    console.error('Error fetching categories:', JSON.stringify(error, null, 2));
    return [];
  }

  // استخراج دسته‌بندی‌های یکتا
  const uniqueCategories = Array.from(new Set(data.map(item => item.category_slug)));
  return uniqueCategories;
}

/**
 * Fetches all providers for a given category slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('category_slug', slug);

  if (error) {
    console.error(`Error fetching providers for category ${slug}:`, error);
    return [];
  }

  return data;
}

/**
 * Fetches all services for a given category slug.
 * اگر services نداری، می‌تونی همین providers رو برگردونی
 */
export async function getServicesByCategory(categorySlug: string): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('category_slug', categorySlug);

  if (error) {
    console.error('Error fetching services by category:', error);
    return [];
  }

  return data as Service[];
}

/**
 * Fetches a single provider's public profile by their UUID.
 */
export async function getProviderProfile(providerId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single();

  if (error) {
    console.error(`Error fetching provider profile for ${providerId}:`, error);
    return null;
  }

  return data;
}

/**
 * Searches for providers based on a query.
 */
export async function searchProviders(query: string): Promise<Profile[]> {
  const supabase = createClient();
  if (!query) return [];

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .textSearch('fts', query, { type: 'websearch', config: 'english' });

  if (error) {
    console.error('Error searching providers:', error);
    return [];
  }

  return data;
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
