// This file will be our Data Access Layer.
// All functions that interact with Supabase will live here.
// The UI components will call these functions instead of directly
// interacting with Supabase. This makes the code cleaner, more testable,
// and easier to maintain or switch data sources in the future.

import { createClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement } from './types';
import { services, categories } from './constants'; // We might still need static data

// IMPORTANT: These values should be loaded from environment variables
// We'll add them to .env.local later. For now, they are placeholders.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the Supabase client
// We are asserting non-null here because we will ensure these are set in the environment.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Provider Functions ---

export async function getAllProviders(): Promise<Provider[]> {
  console.log("API: Fetching all providers from Supabase");
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching providers:', error);
    throw new Error('Could not fetch providers from the database.');
  }

  // The data from Supabase needs to be mapped to our Provider type.
  // Supabase uses snake_case, our app uses camelCase.
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
      portfolio: p.portfolio || [], // Ensure portfolio is always an array
  }));
}

// We will add more functions here as we migrate each piece of functionality,
// for example:
//
// export async function getProviderByPhone(phone: string): Promise<Provider | null> { ... }
// export async function createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> { ... }
//
// etc.
