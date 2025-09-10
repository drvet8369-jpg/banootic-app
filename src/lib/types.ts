import type { PostgrestError } from '@supabase/supabase-js';

// --- Static Data (from constants.ts) ---
export interface Category {
  id: number;
  name: string;
  slug: 'beauty' | 'cooking' | 'tailoring' | 'handicrafts';
  description: string;
}

export interface Service {
  name: string;
  slug: string;
  categorySlug: Category['slug'];
}


// --- Database Table Types ---

// Represents `public.users` table
export interface UserProfile {
  id: string; // UUID from auth.users
  name: string;
  phone: string;
  account_type: 'customer' | 'provider';
  created_at: string;
}

// Represents `public.providers` table
export interface Provider {
  id: number; // Auto-incrementing primary key
  user_id: string; // Foreign key to public.users.id
  name: string;
  phone: string;
  service: string;
  location: string;
  bio: string;
  category_slug: string;
  service_slug: string;
  rating: number;
  reviews_count: number;
  profile_image: PortfolioItem;
  portfolio: PortfolioItem[];
  created_at: string;
}

// Represents `public.customers` table
export interface Customer {
  id: number; // Auto-incrementing primary key
  user_id: string; // Foreign key to public.users.id
  created_at: string;
}

// Represents `public.reviews` table
export interface Review {
  id: number;
  provider_id: number; // Foreign key to public.providers.id
  customer_id: string; // Foreign key to public.users.id
  customer_name: string; // Added for convenience, can be joined
  rating: number;
  comment: string;
  created_at: string;
}

// Represents `public.agreements` table
export interface Agreement {
  id: number;
  customer_phone: string;
  provider_phone: string;
  status: 'pending' | 'confirmed';
  requested_at: string;
  confirmed_at: string | null;
}

// Represents `public.conversations` table
export interface Conversation {
    id: string; // UUID
    created_at: string;
    participant_one_id: string; // Foreign key to users.id
    participant_two_id: string; // Foreign key to users.id
    last_message_at: string | null;
}

// Represents `public.messages` table
export interface Message {
    id: string; // UUID
    conversation_id: string; // Foreign key to conversations.id
    sender_id: string; // Foreign key to users.id
    receiver_id: string; // Foreign key to users.id
    content: string;
    created_at: string;
    is_read: boolean;
}


// --- API & Component-specific Types ---
export interface PortfolioItem {
  src: string;
  ai_hint?: string; // Changed to match DB schema
}

export interface ApiError {
  message: string;
  error?: PostgrestError;
}
