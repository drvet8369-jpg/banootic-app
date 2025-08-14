import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Firebase Auth UID (which is the phone number)
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
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
  aiHint?: string;
}

export interface Provider {
  id: string; // Document ID
  name: string;
  service: string; 
  location: string;
  phone: string; // Also the document ID in Firestore
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: Service['slug'];
  rating: number;
  reviewsCount: number;
  profileImage: PortfolioItem; 
  portfolio: PortfolioItem[];
}

export interface Review {
  id: string;
  providerId: string; // Corresponds to Provider's phone/id
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO String format
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
  isEdited?: boolean;
}


export interface Agreement {
  id: string;
  providerId: string;
  providerPhone: string;
  providerName: string;
  customerPhone: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string; // ISO String
  requestedAt: string; // ISO String
}
