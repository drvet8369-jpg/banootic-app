
import type { Timestamp } from 'firebase/firestore';

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

// Represents the joined data from `providers` and `profiles` tables for display purposes
export interface Provider {
  id: number; // providers.id
  profile_id: string; // profiles.id (UUID)
  name: string; // providers.name
  service: string; 
  location: string;
  phone: string;
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: string; 
  rating: number;
  reviewsCount: number;
  profileImage: { src: string; aiHint?: string; }; // From profiles.profile_image_url
  portfolio: PortfolioItem[]; // from profiles.portfolio
}

export interface Review {
  id: string;
  provider_id: string; // This is the UUID of the provider's profile.
  author_id: string; // UUID of the author
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO String format
}

// Represents a message in the database
export type Message = {
  id: string; // uuid
  created_at: string; // timestampz
  conversation_id: string; // uuid, fk to conversations.id
  sender_id: string; // uuid, fk to profiles.id
  receiver_id: string; // uuid, fk to profiles.id
  content: string;
  is_edited?: boolean;
};

// Represents a conversation in the database
export type Conversation = {
  id: string; // uuid
  created_at: string; // timestampz
  participant_one_id: string; // uuid, fk to profiles.id
  participant_two_id: string; // uuid, fk to profiles.id
};

// Type for displaying a conversation in the inbox list
export type InboxConversation = {
  id: string;
  created_at: string;
  participant_one_id: string;
  participant_two_id: string;
  other_participant: {
    id: string;
    full_name: string | null;
    phone: string | null;
    profile_image_url: string | null;
  };
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
};


// Represents the exact structure of the `profiles` table in Supabase
export type Profile = {
  id: string; // This is the UUID from auth.users
  account_type: 'customer' | 'provider';
  full_name: string | null;
  phone: string | null;
  profile_image_url: string | null; // This is the text column
  portfolio: PortfolioItem[] | null; // This is the jsonb column
  service_id: number | null; // The foreign key to the services table
};
