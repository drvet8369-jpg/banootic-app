
import { createClient } from './supabase/server';
import type { Provider, Review } from './types';
import { unstable_noStore as noStore } from 'next/cache';

export async function getProviders(query?: {
  categorySlug?: string;
  serviceSlug?: string;
  searchQuery?: string;
}): Promise<Provider[]> {
  noStore();
  const supabase = await createClient(); // ✅ اضافه کردن await
  
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

  return data.map(p => ({
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
    profileImage: p.profile_image,
    portfolio: [],
  }));
}

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  noStore();
  const supabase = await createClient(); // ✅ اضافه کردن await
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
    console.error('Error fetching provider by phone:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    service: data.service,
    location: data.location,
    phone: data.phone,
    bio: data.bio,
    categorySlug: data.category_slug,
    serviceSlug: data.service_slug,
    rating: data.rating,
    reviewsCount: data.reviews_count,
    profileImage: data.profile_image,
    portfolio: data.portfolio_items.map(item => ({
      src: item.image_url,
      aiHint: item.ai_hint,
    })),
  };
}

export async function getReviewsForProvider(providerId: number): Promise<Review[]> {
  noStore();
  const supabase = await createClient(); // ✅ اضافه کردن await
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
