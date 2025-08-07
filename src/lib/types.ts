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
  agreementsCount?: number;
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
  id: string;
  text: string;
  senderId: string;
  createdAt: string; // Using ISO string for localStorage
  isEdited?: boolean;
}

export interface Agreement {
  id: string;
  providerPhone: string;
  providerName?: string;
  customerPhone: string;
  customerName: string;
  status: 'pending' | 'confirmed';
  requestedAt: string; // ISO String
}
