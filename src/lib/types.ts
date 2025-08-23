import type { Timestamp } from 'firebase/firestore';

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

// Corrected Provider type to match Supabase schema
export interface Provider {
  id: string; // Changed from number to string for UUID
  name: string;
  service: string;
  location: string;
  phone: string;
  bio: string;
  category_slug: Category['slug']; // Renamed from categorySlug
  service_slug: Service['slug']; // Renamed from serviceSlug
  rating: number;
  reviews_count: number; // Renamed from reviewsCount
  profile_image: PortfolioItem; // Renamed from profileImage
  portfolio: PortfolioItem[];
}

// Corrected Review type to match Supabase schema
export interface Review {
  id: string; // Changed from string to match UUID
  provider_id: string; // Changed from number to string for UUID
  author_name: string;
  rating: number;
  comment: string;
  created_at: string; // ISO String format
}

export interface Message {
  text: string;
  senderId: string;
  receiverId?: string;
  createdAt: Timestamp;
}
