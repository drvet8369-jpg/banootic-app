import 'server-only';
import { createClient } from './supabase/server';
import type { Provider, Review } from './types';
import { unstable_noStore as noStore } from 'next/cache';

// This file is for data fetching on the server.
// The 'server-only' package prevents it from being imported into client components.

type GetProvidersQuery = {
  categorySlug?: string;
  serviceSlug?: string;
  searchQuery?: string;
}

export async function getProviders(query: GetProvidersQuery): Promise<Provider[]> {
  noStore();
  const supabase = createClient();
  
  let queryBuilder = supabase
    .from('providers')
    .select(`
      id,
      name,
      service,
      location,
      phone,
      bio,
      category_slug,
      service_slug,
      rating,
      reviews_count,
      profile_image
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

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }

  // Map the data to the simplified Provider type
  return data.map(p => ({
    id: p.id,
    name: p.name,
    service: p.service ?? '',
    location: p.location ?? '',
    phone: p.phone,
    bio: p.bio ?? '',
    categorySlug: p.category_slug as any ?? 'beauty',
    serviceSlug: p.service_slug ?? '',
    rating: p.rating ?? 0,
    reviewsCount: p.reviews_count ?? 0,
    profileImage: { 
        src: p.profile_image?.src || '', 
        aiHint: p.profile_image?.aiHint || 'woman portrait' 
    },
    // Portfolio is fetched separately to avoid large joins
    portfolio: [], 
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
    categorySlug: data.category_slug as any ?? 'beauty',
    serviceSlug: data.service_slug ?? '',
    rating: data.rating ?? 0,
    reviewsCount: data.reviews_count ?? 0,
    profileImage: {
        src: data.profile_image?.src || '',
        aiHint: data.profile_image?.aiHint || 'woman portrait'
    },
    portfolio: data.portfolio_items.map((item: any) => ({
      id: item.id,
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
