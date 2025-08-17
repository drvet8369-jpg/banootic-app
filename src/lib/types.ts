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

export interface Agreement {
  id: number; // Supabase ID
  providerPhone: string;
  customerPhone: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'rejected';
  requested_at: string; // Supabase returns snake_case
  confirmedAt?: string | null; // camelCase for JS/TS
}
