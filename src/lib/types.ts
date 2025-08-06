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
  name: string;
  service: string; // The specific service they provide, e.g., "Manicure"
  location: string;
  phone: string; // The phone number is the unique ID for the provider
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: Service['slug']; // Link to the service
  rating: number;
  reviewsCount: number;
  agreementsCount: number; // To count agreements/orders
  profileImage: PortfolioItem; // Dedicated profile image
  portfolio: PortfolioItem[];
}

export interface Review {
  id: string;
  providerId: string; // Now stores the provider's phone number
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

export interface Agreement {
  id: string;
  providerPhone: string;
  providerName: string; // Name of the provider for easy display
  customerPhone: string;
  customerName:string;
  status: 'pending' | 'confirmed';
  requestedAt: string; // ISO String format
}
