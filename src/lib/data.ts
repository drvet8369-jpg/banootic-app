import type { Category, Provider, Service, Review, Agreement } from './types';

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
  // --- Test Data for Ranking ---
  { id: 1, name: 'سالن زیبایی سارا (فوق ستاره)', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09000000001', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.9, reviewsCount: 120, agreementsCount: 80, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 4, name: 'آشپزخانه مریم (بسیار محبوب)', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.8, reviewsCount: 200, agreementsCount: 150, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { id: 7, name: 'خیاطی شیرین (فعال و متوسط)', service: 'دوخت سفارشی لباس', location: 'ارومیه، خیابان مدرس', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 3.8, reviewsCount: 180, agreementsCount: 250, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { id: 2, name: 'طراحی مو لاله (جدید و با کیفیت)', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 5.0, reviewsCount: 3, agreementsCount: 2, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { id: 5, name: 'شیرینی‌پزی بهار (معمولی)', service: 'کیک و شیرینی', location: 'ارومیه، خیابان کشاورز', phone: '09000000005', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets', rating: 4.5, reviewsCount: 25, agreementsCount: 15, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' }, portfolio: [] },
  { id: 10, name: 'گالری گیتا (بدون فعالیت)', service: 'زیورآلات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.2, reviewsCount: 5, agreementsCount: 0, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { id: 11, name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه, خیابان بهار', phone: '09000000011', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', rating: 4.7, reviewsCount: 28, agreementsCount: 10, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { id: 13, name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه, خیابان کاشانی', phone: '09000000013', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 5.0, reviewsCount: 25, agreementsCount: 20, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
];

const PROVIDERS_STORAGE_KEY = 'honarbanoo-providers';
const REVIEWS_STORAGE_KEY = 'honarbanoo-reviews';
const AGREEMENTS_STORAGE_KEY = 'honarbanoo-agreements';


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


// --- Agreements ---
const defaultAgreements: Agreement[] = [];

// Function to get agreements
export const getAgreements = (): Agreement[] => {
  if (typeof window === 'undefined') {
    return defaultAgreements;
  }
  try {
    const storedAgreements = localStorage.getItem(AGREEMENTS_STORAGE_KEY);
    if (storedAgreements) {
      return JSON.parse(storedAgreements);
    } else {
      localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(defaultAgreements));
      return defaultAgreements;
    }
  } catch (error) {
    console.error("Failed to access localStorage for agreements.", error);
    return defaultAgreements;
  }
};

// Function to save agreements
export const saveAgreements = (updatedAgreements: Agreement[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(updatedAgreements));
  } catch (error) {
    console.error("Failed to save agreements to localStorage.", error);
  }
};
