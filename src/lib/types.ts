
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
  service: string; 
  location: string;
  phone: string;
  bio: string;
  category_slug: Category['slug']; // Matches DB column
  service_slug: Service['slug']; // Matches DB column
  rating: number;
  reviews_count: number; // Matches DB column
  profileimage: PortfolioItem; // Corrected to match database column name
  portfolio: PortfolioItem[];
}

export interface Review {
  id: number;
  provider_id: number; // Corrected: Was providerId
  author_name: string; // Corrected: Was authorName
  rating: number;
  comment: string;
  created_at: string; // Corrected: Was createdAt
}

export interface Agreement {
  id: number;
  provider_phone: string; // Corrected: Was provider_phone
  customer_phone: string; // Corrected: Was customer_phone
  customer_name: string; // Corrected: Was customer_name
  status: 'pending' | 'confirmed' | 'rejected';
  requested_at: string; // Corrected: Was requested_at
  confirmed_at?: string | null; // Corrected: Was confirmed_at
}
