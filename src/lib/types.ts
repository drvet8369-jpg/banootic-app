export interface Category {
  id: number;
  name: string;
  slug: 'beauty' | 'cooking' | 'tailoring' | 'fashion';
  description: string;
}

export interface Service {
  name: string;
  slug: string;
  categorySlug: Category['slug'];
}

export interface Provider {
  id: number;
  name: string;
  service: string; // The specific service they provide, e.g., "Manicure"
  location: string;
  phone: string;
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: Service['slug']; // Link to the service
}
