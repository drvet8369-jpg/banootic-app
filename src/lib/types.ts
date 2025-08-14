export interface User {
  id: string; // Using string for ID to be compatible with Firestore
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
  bio?: string;
  serviceType?: string;
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
  id: number; // Keep this for existing logic, but Firestore will use phone as doc ID
  name: string;
  service: string; 
  location: string;
  phone: string; 
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
  providerId: number; 
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO String format
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string; // ISO String format is better for Firestore
  isEdited?: boolean;
}
