
import 'server-only';
import { createClient } from './supabase/server';
import type { Provider, Review, PortfolioItem } from './types';
import { unstable_noStore as noStore } from 'next/cache';

// This file is for data fetching on the server.
// The 'server-only' package prevents it from being imported into client components.

type GetProvidersQuery = {
  categorySlug?: string;
  serviceSlug?: string;
  searchQuery?: string;
}

export async function getProviders(query: GetProvidersQuery = {}): Promise<Provider[]> {
  noStore();
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
      profiles!inner (
        profile_image_url,
        portfolio
      )
    `);

  if (query.categorySlug) {
    queryBuilder = queryBuilder.eq('category_slug', query.categorySlug);
  }
  if (query.serviceSlug) {
    queryBuilder = queryBuilder.eq('service_slug', query.serviceSlug);
  }
  if (query.searchQuery) {
    const searchQuery = query.searchQuery;
    queryBuilder = queryBuilder.or(
      `name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,service.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await queryBuilder.order('id');

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    profile_id: p.profile_id,
    name: p.name,
    service: p.service ?? '',
    location: p.location ?? '',
    phone: p.phone,
    bio: p.bio ?? '',
    categorySlug: p.category_slug as any ?? 'beauty',
    serviceSlug: p.service_slug ?? '',
    rating: p.rating ?? 0,
    reviewsCount: p.reviews_count ?? 0,
    profileImage: { src: p.profiles?.profile_image_url ?? '', aiHint: 'woman portrait' },
    portfolio: (Array.isArray(p.profiles?.portfolio) ? p.profiles.portfolio : []) as PortfolioItem[],
  }));
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  noStore();
  const supabase = createClient();

  const { data, error } = await supabase
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
      profiles!inner (
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

  const p = data as any;

  return {
    id: p.id,
    profile_id: p.profile_id,
    name: p.name,
    service: p.service ?? '',
    location: p.location ?? '',
    phone: p.phone,
    bio: p.bio ?? '',
    categorySlug: p.category_slug as any ?? 'beauty',
    serviceSlug: p.service_slug ?? '',
    rating: p.rating ?? 0,
    reviewsCount: p.reviews_count ?? 0,
    profileImage: { src: p.profiles?.profile_image_url ?? '', aiHint: 'woman portrait' },
    portfolio: (Array.isArray(p.profiles?.portfolio) ? p.profiles.portfolio : []) as PortfolioItem[],
  };
}

export async function getReviewsForProvider(profileId: string): Promise<Review[]> {
  noStore();
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data.map(r => ({
    id: r.id.toString(),
    provider_id: r.provider_id,
    author_id: r.author_id,
    authorName: r.author_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}
