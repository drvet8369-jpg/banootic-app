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
  id: number;
  name: string;
  service: string; // The specific service they provide, e.g., "Manicure"
  location: string;
  phone: string;
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: Service['slug']; // Link to the service
  rating: number;
  reviewsCount: number;
  profileImage: PortfolioItem; // Dedicated profile image
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
