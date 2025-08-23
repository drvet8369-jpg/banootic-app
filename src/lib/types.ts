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
  ai_hint?: string;
}

export interface Provider {
  id: string; 
  user_id: string;
  created_at: string;
  name: string;
  service: string;
  location: string;
  phone: string;
  bio: string;
  category_slug: Category['slug'];
  service_slug: Service['slug'];
  rating: number;
  reviews_count: number;
  profile_image: PortfolioItem;
  portfolio: PortfolioItem[];
}

export interface Customer {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  phone: string;
}

export interface Review {
  id: string;
  provider_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Agreement {
  id: number;
  provider_id: string;
  provider_phone: string;
  customer_phone: string;
  customer_name: string;
  status: 'pending' | 'confirmed';
  requested_at: string;
  confirmed_at: string | null;
}

    