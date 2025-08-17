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
  aiHint?: string;
}

export interface Provider {
  id: number; // This will now be the Supabase auto-generated ID
  name: string;
  service: string; 
  location: string;
  phone: string; // Keep as a unique identifier for now
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: Service['slug'];
  rating: number;
  reviewsCount: number;
  profileImage: PortfolioItem;
  portfolio: PortfolioItem[];
}

export interface Review {
  id: number; // This will now be the Supabase auto-generated ID
  providerId: number; // Foreign key to Provider.id
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // Supabase returns ISO String for timestamps
}

export interface Message {
  text: string;
  senderId: string;
  receiverId?: string;
  createdAt: Timestamp;
}

export interface Agreement {
  id: string;
  providerPhone: string;
  customerPhone: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'rejected';
  requestedAt: string; // ISO String
  confirmedAt?: string; // ISO String
}
