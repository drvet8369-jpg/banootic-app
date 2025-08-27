
export interface User {
  id: string; // This is the user_id from the DB (UUID)
  name: string;
  phone: string; 
  account_type: 'customer' | 'provider';
  created_at: string;
}

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

export interface Provider {
  id: string; 
  user_id: string;
  created_at: string;
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

export interface Customer {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  phone: string;
}

export interface Review {
  id: string;
  provider_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Agreement {
  id: number;
  provider_id: string;
  customer_id: string;
  provider_phone: string;
  customer_phone: string;
  customer_name: string;
  status: 'pending' | 'confirmed';
  requested_at: string;
  confirmed_at: string | null;
}

export interface Conversation {
    id: string;
    created_at: string;
    participant_one_id: string;
    participant_two_id: string;
    last_message_id?: number | null;
    last_message_at?: string | null;
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

// Type for the data returned by the API for the inbox page
export interface ConversationSummary {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_phone: string;
  other_user_profile_image: { src: string | null; ai_hint: string | null };
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
}
