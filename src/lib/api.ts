// This file will be our Data Access Layer.
// All functions that interact with Supabase will live here.
// The UI components will call these functions instead of directly
// interacting with Supabase. This makes the code cleaner, more testable,
// and easier to maintain or switch data sources in the future.

import { createClient } from '@supabase/supabase-js';
import type { Provider, Review, Agreement } from './types';
import { services, categories } from './data'; // We might still need static data

// IMPORTANT: These values should be loaded from environment variables
// We'll add them to .env.local later. For now, they are placeholders.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the Supabase client
// We are asserting non-null here because we will ensure these are set in the environment.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Provider Functions ---

export async function getAllProviders(): Promise<Provider[]> {
  // For now, we will just return the static data to ensure the structure is sound.
  // In the next step, we will replace this with a real Supabase query.
  console.log("API: Fetching all providers (currently from static data)");
  // This is where the Supabase call will go.
  // const { data, error } = await supabase.from('providers').select('*');
  // if (error) throw error;
  // return data;
  return []; // Returning empty for now to prove the concept
}

// We will add more functions here as we migrate each piece of functionality,
// for example:
//
// export async function getProviderByPhone(phone: string): Promise<Provider | null> { ... }
// export async function createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> { ... }
//
// etc.
