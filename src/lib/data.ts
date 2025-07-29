import type { Category, Provider, Service, Review } from './types';

export const categories: Category[] = [
  {
    id: 1,
    name: 'Women’s Beauty Services',
    slug: 'beauty',
    description: 'Hair, nail, makeup, and skincare services by talented local professionals.',
  },
  {
    id: 2,
    name: 'Homemade Cooking & Food',
    slug: 'cooking',
    description: 'Delicious and authentic homemade meals, pastries, and traditional cuisine.',
  },
  {
    id: 3,
    name: 'Tailoring & Fashion Design',
    slug: 'tailoring',
    description: 'Custom clothing, alterations, and unique fashion designs from local boutiques.',
  },
  {
    id: 4,
    name: 'Handicrafts & Decorative Arts',
    slug: 'handicrafts',
    description: 'Unique decorative crafts, decorative arts, and one-of-a-kind handmade products.',
  },
];

export const services: Service[] = [
  // Beauty
  { name: 'Nail Services', slug: 'manicure-pedicure', categorySlug: 'beauty' },
  { name: 'Hair Services', slug: 'haircut-coloring', categorySlug: 'beauty' },
  { name: 'Facial Treatments', slug: 'facial-treatment', categorySlug: 'beauty' },
  { name: 'Makeup Artistry', slug: 'makeup', categorySlug: 'beauty' },
  { name: 'Waxing Services', slug: 'waxing', categorySlug: 'beauty' },
  // Cooking
  { name: 'Traditional Cuisine', slug: 'traditional-food', categorySlug: 'cooking' },
  { name: 'Cakes & Sweets', slug: 'cakes-sweets', categorySlug: 'cooking' },
  { name: 'Vegetarian & Vegan', slug: 'vegetarian-vegan', categorySlug: 'cooking' },
  { name: 'Finger Foods', slug: 'finger-food', categorySlug: 'cooking' },
  { name: 'Homemade Bread', slug: 'homemade-bread', categorySlug: 'cooking' },
  // Tailoring
  { name: 'Custom Clothing', slug: 'custom-clothing', categorySlug: 'tailoring' },
  { name: 'Bridal & Evening Wear', slug: 'fashion-design-mezon', categorySlug: 'tailoring' },
  { name: 'Clothing Repair', slug: 'clothing-repair', categorySlug: 'tailoring' },
  // Handicrafts
  { name: 'Handmade Jewelry', slug: 'handmade-jewelry', categorySlug: 'handicrafts' },
  { name: 'Decorative Pottery', slug: 'decorative-pottery', categorySlug: 'handicrafts' },
  { name: 'Knitted Goods', slug: 'knitted-goods', categorySlug: 'handicrafts' },
  { name: 'Leather Crafts', slug: 'leather-crafts', categorySlug: 'handicrafts' },
  { name: 'Candle Making', slug: 'candles-soaps', categorySlug: 'handicrafts' },
];

const defaultProviders: Provider[] = [
  // Beauty
  { id: 1, name: 'Sara\'s Beauty Salon', service: 'Nail Services', location: 'Urmia, Valiasr St', phone: '09353847484', bio: 'Specializing in modern nail art and design.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.8, reviewsCount: 45, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 2, name: 'Laleh Hair Design', service: 'Hair Services', location: 'Urmia, Sheikh Tappeh', phone: '09000000002', bio: 'Expert in balayage and modern hairstyles.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', rating: 4.9, reviewsCount: 62, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { id: 3, name: 'Negin Skincare', service: 'Facial Treatments', location: 'Urmia, Ostadan', phone: '09000000003', bio: 'Organic and natural skin treatments for all skin types.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', rating: 4.7, reviewsCount: 30, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { id: 13, name: 'Roya Makeup Studio', service: 'Makeup Artistry', location: 'Urmia, Kashani St', phone: '09000000013', bio: 'Specialized bridal makeup and professional makeup for events.', categorySlug: 'beauty', serviceSlug: 'makeup', rating: 5.0, reviewsCount: 25, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
  { id: 14, name: 'Nazi Waxing Center', service: 'Waxing Services', location: 'Urmia, Varzesh St', phone: '09000000014', bio: 'Full body waxing using premium and hygienic products.', categorySlug: 'beauty', serviceSlug: 'waxing', rating: 4.6, reviewsCount: 55, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman beautiful' }, portfolio: [] },
  
  // Cooking
  { id: 4, name: 'Maryam\'s Kitchen', service: 'Traditional Cuisine', location: 'Urmia, Ferdowsi St', phone: '09000000004', bio: 'Serving authentic Ghormeh Sabzi and homemade kebabs.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.9, reviewsCount: 112, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { 
    id: 5, 
    name: 'Bahar Pastry', 
    service: 'Cakes & Sweets', 
    location: 'Urmia, Keshavarz St', 
    phone: '09000000005', 
    bio: 'Custom cakes for birthdays, weddings, and special events.', 
    categorySlug: 'cooking', 
    serviceSlug: 'cakes-sweets', 
    rating: 4.8, 
    reviewsCount: 88, 
    profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' },
    portfolio: []
  },
  { id: 6, name: 'Zahra\'s Healthy Food', service: 'Vegetarian & Vegan', location: 'Urmia, Daneshkadeh', phone: '09000000006', bio: 'Delicious and healthy plant-based meals with home delivery.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan', rating: 4.7, reviewsCount: 40, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'healthy food' }, portfolio: [] },
  { id: 15, name: 'Chic Finger Foods', service: 'Finger Foods', location: 'Urmia, Ammar', phone: '09000000015', bio: 'Assorted platters and various finger foods for parties.', categorySlug: 'cooking', serviceSlug: 'finger-food', rating: 4.9, reviewsCount: 75, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'party food' }, portfolio: [] },
  { id: 16, name: 'Gandom Homemade Bread', service: 'Homemade Bread', location: 'Urmia, Molavi', phone: '09000000016', bio: 'Daily baking of various artisan, traditional, and diet breads.', categorySlug: 'cooking', serviceSlug: 'homemade-bread', rating: 5.0, reviewsCount: 95, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'baker woman' }, portfolio: [] },
  
  // Tailoring
  { id: 7, name: 'Shirin Tailoring', service: 'Custom Clothing', location: 'Urmia, Modarres St', phone: '09000000007', bio: 'Beautiful and custom-made clothes for any occasion.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 4.8, reviewsCount: 50, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { id: 8, name: 'Parvin Design', service: 'Clothing Repair', location: 'Urmia, Imam St', phone: '09000000008', bio: 'Professional and quick alterations for a perfect fit.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair', rating: 4.7, reviewsCount: 35, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion designer' }, portfolio: [] },
  { id: 9, name: 'Afsaneh Boutique', service: 'Bridal & Evening Wear', location: 'Urmia, Khayyam St', phone: '09000000009', bio: 'Unique and stylish manteaus that blend tradition with modern fashion.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 4.9, reviewsCount: 80, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion boutique' }, portfolio: [] },
  { id: 18, name: 'Anahita Fashion House', service: 'Bridal & Evening Wear', location: 'Urmia, Hassani St', phone: '09000000018', bio: 'Designing and sewing evening and formal dresses with special fabrics.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 5.0, reviewsCount: 33, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'evening dress' }, portfolio: [] },
  
  // Handicrafts
  { id: 10, name: 'Gita Art Gallery', service: 'Handmade Jewelry', location: 'Urmia, Besat St', phone: '09000000010', bio: 'Unique silver and gemstone jewelry, made with love.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.9, reviewsCount: 65, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { id: 11, name: 'Mina Pottery', service: 'Decorative Pottery', location: 'Urmia, Bahar St', phone: '09000000011', bio: 'Beautiful, hand-painted pottery for your home and garden.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', rating: 4.7, reviewsCount: 28, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { id: 12, name: 'Saba Knits', service: 'Knitted Goods', location: 'Urmia, Bazaar', phone: '09000000012', bio: 'A variety of hand-knitted clothes and accessories.', categorySlug: 'handicrafts', serviceSlug: 'knitted-goods', rating: 4.8, reviewsCount: 48, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'knitting craft' }, portfolio: [] },
  { id: 19, name: 'Leila Leather Art', service: 'Leather Crafts', location: 'Urmia, Homafer', phone: '09000000019', bio: 'Custom-designed leather bags, belts, and accessories.', categorySlug: 'handicrafts', serviceSlug: 'leather-crafts', rating: 4.9, reviewsCount: 58, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'leather goods' }, portfolio: [] },
  { id: 20, name: 'Roya Candle Workshop', service: 'Candle Making', location: 'Urmia, Madani', phone: '09000000020', bio: 'A variety of scented candles and handmade herbal soaps.', categorySlug: 'handicrafts', serviceSlug: 'candles-soaps', rating: 4.8, reviewsCount: 72, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'candle maker' }, portfolio: [] },
];

const PROVIDERS_STORAGE_KEY = 'zanmahal-providers';
const REVIEWS_STORAGE_KEY = 'zanmahal-reviews';

// Function to get providers from localStorage or return default
export const getProviders = (): Provider[] => {
  if (typeof window === 'undefined') {
    return defaultProviders;
  }
  try {
    const storedProviders = localStorage.getItem(PROVIDERS_STORAGE_KEY);
    if (storedProviders) {
      const parsedProviders = JSON.parse(storedProviders);
      return parsedProviders;
    } else {
      // If nothing is in storage, initialize it with the default data
      localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(defaultProviders));
      return defaultProviders;
    }
  } catch (error) {
    console.error("Failed to access localStorage, returning default providers.", error);
    return defaultProviders;
  }
};

// Function to save providers to localStorage
export const saveProviders = (updatedProviders: Provider[]) => {
   if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(updatedProviders));
  } catch (error) {
    console.error("Failed to save providers to localStorage.", error);
  }
};

// --- Reviews ---
const defaultReviews: Review[] = [];

// Function to get reviews from localStorage
export const getReviews = (): Review[] => {
  if (typeof window === 'undefined') {
    return defaultReviews;
  }
  try {
    const storedReviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (storedReviews) {
      return JSON.parse(storedReviews);
    } else {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(defaultReviews));
      return defaultReviews;
    }
  } catch (error) {
    console.error("Failed to access localStorage for reviews.", error);
    return defaultReviews;
  }
};

// Function to save reviews to localStorage
export const saveReviews = (updatedReviews: Review[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updatedReviews));
  } catch (error) {
    console.error("Failed to save reviews to localStorage.", error);
  }
};
