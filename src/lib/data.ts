import { createClient } from './supabase/server';
import type { Provider, Review, PortfolioItem } from './types';
import { unstable_noStore as noStore } from 'next/cache';

// This file is simplified. All data now comes from Supabase.
// The functions are now async as they fetch data from the database.

type GetProvidersQuery = {
  categorySlug?: string;
  serviceSlug?: string;
  searchQuery?: string;
}

export async function getProviders(query?: GetProvidersQuery): Promise<Provider[]> {
  noStore();
  const supabase = createClient();
  
  let queryBuilder = supabase
    .from('providers')
    .select(`
      *,
      portfolio_items ( id, image_url, ai_hint )
    `);

  if (query?.categorySlug) {
    queryBuilder = queryBuilder.eq('category_slug', query.categorySlug);
  }
  if (query?.serviceSlug) {
    queryBuilder = queryBuilder.eq('service_slug', query.serviceSlug);
  }
  if (query?.searchQuery) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query.searchQuery}%,bio.ilike.%${query.searchQuery}%,service.ilike.%${query.searchQuery}%`
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  // Map the data to the simplified Provider type
  return data.map(p => ({
    id: p.id,
    profile_id: p.profile_id,
    name: p.name,
    service: p.service ?? '',
    location: p.location ?? '',
    phone: p.phone,
    bio: p.bio ?? '',
    categorySlug: p.category_slug ?? 'beauty',
    serviceSlug: p.service_slug ?? '',
    rating: p.rating ?? 0,
    reviewsCount: p.reviews_count ?? 0,
    profileImage: { 
        src: p.profile_image?.src || '', 
        aiHint: p.profile_image?.aiHint || 'woman portrait' 
    },
    portfolio: p.portfolio_items.map((item: any): PortfolioItem => ({
      src: item.image_url,
      aiHint: item.ai_hint,
    })),
  }));
}

export async function getProviderByPhone(phone: string): Promise<(Provider & { profile_id: string }) | null> {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select(`
      *,
      portfolio_items (
        id,
        image_url,
        ai_hint
      )
    `)
    .eq('phone', phone)
    .single();

  if (error || !data) {
    console.error(`Error fetching provider by phone ${phone}:`, error);
    return null;
  }

  return {
    id: data.id,
    profile_id: data.profile_id,
    name: data.name,
    service: data.service ?? '',
    location: data.location ?? '',
    phone: data.phone,
    bio: data.bio ?? '',
    categorySlug: data.category_slug ?? 'beauty',
    serviceSlug: data.service_slug ?? '',
    rating: data.rating ?? 0,
    reviewsCount: data.reviews_count ?? 0,
    profileImage: {
        src: data.profile_image?.src || '',
        aiHint: data.profile_image?.aiHint || 'woman portrait'
    },
    portfolio: data.portfolio_items.map((item: any): PortfolioItem => ({
      src: item.image_url,
      aiHint: item.ai_hint,
    })),
  };
}

export async function getReviewsForProvider(providerId: number): Promise<Review[]> {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data.map(r => ({
    id: r.id.toString(),
    providerId: r.provider_id,
    authorName: r.author_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}