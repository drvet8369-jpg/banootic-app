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

export interface Provider {
  id: number;
  profile_id: string;
  name: string;
  service: string; // The specific service they provide, e.g., "Manicure"
  location: string;
  phone: string;
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: string; 
  rating: number;
  reviewsCount: number;
  profileImage: { src: string; aiHint?: string; };
  portfolio: PortfolioItem[];
}

export interface Review {
  id: string;
  providerId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO String format
}

export interface Message {
  text: string;
  senderId: string;
  receiverId?: string;
  createdAt: Timestamp;
}

// From Supabase
export type Profile = {
  id: string;
  account_type: 'customer' | 'provider';
  full_name: string | null;
  phone: string | null;
};
