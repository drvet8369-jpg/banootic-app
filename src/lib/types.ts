export interface Category {
  id: number;
  name: string;
  slug: 'beauty' | 'cooking' | 'tailoring' | 'handicrafts';
  description: string;
}

export interface Provider {
  id: number;
  name: string;
  service: string;
  location: string;
  phone: string;
  bio: string;
  categorySlug: 'beauty' | 'cooking' | 'tailoring' | 'handicrafts';
}
