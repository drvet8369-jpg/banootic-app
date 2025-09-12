export interface Category {
  id: number;
  name: string;
  slug: 'beauty' | 'cooking' | 'tailoring' | 'handicrafts';
  description: string;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  category_id: number;
}

export interface PortfolioItem {
  src: string;
  aiHint?: string;
}

// This represents the public profile of a user, especially providers
export interface Profile {
  id: string; // Corresponds to auth.users.id
  account_type: 'customer' | 'provider';
  full_name: string;
  service_description?: string; // e.g., "خدمات ناخن"
  bio?: string;
  location?: string;
  phone?: string;
  // Fields related to being a provider
  category_id?: number;
  service_id?: number; // Main service
  rating?: number;
  reviews_count?: number;
  profile_image_url?: string;
  portfolio_urls?: string[];

  // Joined data
  category_name?: string;
  service_name?: string;
}


export interface Review {
  id: string;
  provider_id: string; // The UUID of the provider's profile
  author_id: string;   // The UUID of the customer's profile
  author_name: string; // Denormalized author name for easy display
  rating: number;
  comment: string;
  created_at: string; // ISO String format
}

// This is different from the auth user. This is for local chat logic.
export interface ChatParticipant {
    id: string;
    name: string;
    profile_image_url?: string;
}
