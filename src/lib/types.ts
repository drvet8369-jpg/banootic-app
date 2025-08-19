
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
  profileImage: PortfolioItem;
  portfolio: PortfolioItem[];
}

export interface Review {
  id: number;
  provider_id: number; // Matches DB column
  author_name: string;
  rating: number;
  comment: string;
  created_at: string; // Matches DB column
}

export interface Agreement {
  id: number;
  provider_phone: string;
  customer_phone: string;
  customer_name: string;
  status: 'pending' | 'confirmed' | 'rejected';
  requested_at: string;
  confirmed_at?: string | null;
}
