import type { Category, Provider, Service, Review } from './types';

export const categories: Category[] = [
  {
    id: 1,
    name: 'خدمات زیبایی بانوان',
    slug: 'beauty',
    description: 'خدمات مو، ناخن، آرایش و مراقبت از پوست توسط متخصصان محلی با استعداد.',
  },
  {
    id: 2,
    name: 'آشپزی و غذای خانگی',
    slug: 'cooking',
    description: 'غذاهای خانگی خوشمزه و اصیل، شیرینی‌جات و غذاهای سنتی.',
  },
  {
    id: 3,
    name: 'خیاطی و طراحی مد',
    slug: 'tailoring',
    description: 'لباس‌های سفارشی، تعمیرات و طراحی‌های مد منحصر به فرد از بوتیک‌های محلی.',
  },
  {
    id: 4,
    name: 'صنایع دستی و تزئینی',
    slug: 'handicrafts',
    description: 'کاردستی‌های دکوری، هنرهای تزئینی و محصولات دست‌ساز منحصر به فرد.',
  },
];

export const services: Service[] = [
  // Beauty
  { name: 'خدمات ناخن', slug: 'manicure-pedicure', categorySlug: 'beauty' },
  { name: 'خدمات مو', slug: 'haircut-coloring', categorySlug: 'beauty' },
  { name: 'پاکسازی پوست', slug: 'facial-treatment', categorySlug: 'beauty' },
  { name: 'آرایش صورت', slug: 'makeup', categorySlug: 'beauty' },
  { name: 'اپیلاسیون', slug: 'waxing', categorySlug: 'beauty' },
  // Cooking
  { name: 'غذای سنتی', slug: 'traditional-food', categorySlug: 'cooking' },
  { name: 'کیک و شیرینی', slug: 'cakes-sweets', categorySlug: 'cooking' },
  { name: 'غذای گیاهی', slug: 'vegetarian-vegan', categorySlug: 'cooking' },
  { name: 'فینگرفود', slug: 'finger-food', categorySlug: 'cooking' },
  { name: 'نان خانگی', slug: 'homemade-bread', categorySlug: 'cooking' },
  // Tailoring
  { name: 'دوخت سفارشی لباس', slug: 'custom-clothing', categorySlug: 'tailoring' },
  { name: 'مزون، لباس عروس و مجلسی', slug: 'fashion-design-mezon', categorySlug: 'tailoring' },
  { name: 'تعمیرات تخصصی لباس', slug: 'clothing-repair', categorySlug: 'tailoring' },
  // Handicrafts
  { name: 'زیورآلات دست‌ساز', slug: 'handmade-jewelry', categorySlug: 'handicrafts' },
  { name: 'سفال تزئینی', slug: 'decorative-pottery', categorySlug: 'handicrafts' },
  { name: 'بافتنی‌ها', slug: 'termeh-kilim', categorySlug: 'handicrafts' },
  { name: 'چرم‌دوزی', slug: 'leather-crafts', categorySlug: 'handicrafts' },
  { name: 'شمع‌سازی', slug: 'candles-soaps', categorySlug: 'handicrafts' },
];

const defaultProviders: Provider[] = [
  // This list is intentionally left empty for a production-like start.
  // Real providers will be added through the registration form.
];

const PROVIDERS_STORAGE_KEY = 'honarbanoo-providers';
const REVIEWS_STORAGE_KEY = 'honarbanoo-reviews';

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
