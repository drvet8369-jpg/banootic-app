
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
  id: number;
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

export interface Review {
  id: number;
  provider_id: number;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string; // ISO String format
}

export interface Message {
  text: string;
  senderId: string;
  receiverId?: string;
  createdAt: string; // Using string for simplicity, can be Date object
}
