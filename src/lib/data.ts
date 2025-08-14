import type { Category, Provider, Service, Review } from './types';

// This file now acts as the single source of truth for all app data,
// using localStorage for persistence. This simplifies the app by removing
// the need for a complex backend setup for this prototype.

const PROVIDERS_STORAGE_KEY = 'zanmahal-providers';
const REVIEWS_STORAGE_KEY = 'zanmahal-reviews';
const INBOX_CHATS_STORAGE_KEY = 'zanmahal-inbox-chats';

// --- Static Data ---
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


// --- Helper Functions for localStorage ---
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key “${key}”:`, error);
  }
};


// --- Default Data for Initialization ---
const defaultProviders: Provider[] = [
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.8, reviewsCount: 45, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [{src: "https://placehold.co/600x400.png", aiHint: "nail art"}] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', rating: 4.9, reviewsCount: 62, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { id: 3, name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه، استادان', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', rating: 4.7, reviewsCount: 30, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { id: 4, name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.9, reviewsCount: 112, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { id: 5, name: 'شیرینی‌پزی بهار', service: 'کیک و شیرینی', location: 'ارومیه، خیابان کشاورز', phone: '09000000005', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets', rating: 4.8, reviewsCount: 88, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' }, portfolio: [] },
  { id: 7, name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه، خیابان مدرس', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 4.8, reviewsCount: 50, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { id: 10, name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.9, reviewsCount: 65, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
];

const defaultReviews: Review[] = [
    { id: '1', providerId: 1, authorName: 'نگار', rating: 5, comment: 'کارشون عالی و بسیار تمیز بود. خیلی راضی بودم!', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', providerId: 4, authorName: 'فاطمه', rating: 5, comment: 'قورمه‌سبزی به این خوشمزگی نخورده بودم! کاملا طعم غذای خانگی اصیل رو داشت.', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', providerId: 1, authorName: 'زهرا', rating: 4, comment: 'طراحی خوبی داشتند ولی کمی زمان انتظارم طولانی شد.', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
];

// --- Data Access Functions ---
export const getProviders = (): Provider[] => {
  return getFromStorage(PROVIDERS_STORAGE_KEY, defaultProviders);
};

export const saveProviders = (updatedProviders: Provider[]) => {
  saveToStorage(PROVIDERS_STORAGE_KEY, updatedProviders);
};

export const getReviews = (): Review[] => {
  return getFromStorage(REVIEWS_STORAGE_KEY, defaultReviews);
};

export const saveReviews = (updatedReviews: Review[]) => {
  saveToStorage(REVIEWS_STORAGE_KEY, updatedReviews);
};

// Initialize default data if it doesn't exist
if (typeof window !== 'undefined' && !localStorage.getItem(PROVIDERS_STORAGE_KEY)) {
  saveProviders(defaultProviders);
}
if (typeof window !== 'undefined' && !localStorage.getItem(REVIEWS_STORAGE_KEY)) {
  saveReviews(defaultReviews);
}
