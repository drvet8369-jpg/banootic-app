
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

export interface PortfolioItem {
  src: string;
  ai_hint?: string;
}

// Represents the user record in the public.users table
export interface UserProfile {
    id: string; // Corresponds to auth.users.id
    name: string;
    account_type: 'customer' | 'provider';
    phone: string;
    email: string;
}

// Represents a provider record in the public.providers table
export interface Provider {
  id: number; // The auto-incrementing primary key from the providers table
  user_id: string; // The foreign key to auth.users.id
  name: string;
  service: string; 
  location: string;
  phone: string;
  bio: string;
  category_slug: Category['slug'];
  service_slug: Service['slug'];
  rating: number;
  reviews_count: number;
  profile_image: PortfolioItem;
  portfolio: PortfolioItem[];
}

export interface ProviderRegistrationData {
    p_user_id: string;
    p_name: string;
    p_service: string;
    p_location: string;
    p_phone: string;
    p_bio: string;
    p_category_slug: string;
    p_service_slug: string;
}


export interface Customer {
  id: number;
  user_id: string;
  name: string;
  phone: string;
}


export interface Review {
  id: string;
  provider_id: string; // This should be the provider's user_id (UUID)
  author_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string; // ISO String format
}

export interface Conversation {
    id: string; // UUID from the conversations table
    created_at: string;
    participant_one_id: string;
    participant_two_id: string;
    last_message_at: string | null;
}

export interface ConversationSummary {
    conversation_id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_phone: string;
    other_user_profile_image: PortfolioItem | null;
    last_message_content: string | null;
    last_message_at: string | null;
    unread_count: number;
}


export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}


export interface Agreement {
  id: number;
  provider_phone: string;
  customer_phone: string;
  customer_name: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  requested_at: string;
  confirmed_at?: string;
}

// AppUser is the combined user object we'll use throughout the client-side application.
export interface AppUser extends UserProfile {}
