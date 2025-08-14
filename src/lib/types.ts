
export interface User {
  id: string; // phone number or a generated ID
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
  id: number; // A unique ID for the provider
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
  providerId: number; // Corresponds to Provider's id
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO String format
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string; // ISO string
  isEdited?: boolean;
}

export interface Chat {
    id: string;
    members: string[]; // array of user phones
    participants: {
        [key: string]: { // key is user phone
            name: string;
            unreadCount: number;
        }
    };
    lastMessage: string;
    updatedAt: string; // ISO String
}

export interface Agreement {
  id: string;
  providerPhone: string;
  customerPhone: string;
  customerName: string;
  status: 'pending' | 'confirmed';
  requestedAt: string; // ISO string
  confirmedAt?: string; // ISO string
}
