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
  // Beauty
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.8, reviewsCount: 45, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', rating: 4.9, reviewsCount: 62, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { id: 3, name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه، استادان', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', rating: 4.7, reviewsCount: 30, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { id: 13, name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه، خیابان کاشانی', phone: '09000000013', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', categorySlug: 'beauty', serviceSlug: 'makeup', rating: 5.0, reviewsCount: 25, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
  { id: 14, name: 'مرکز اپیلاسیون نازی', service: 'اپیلاسیون', location: 'ارومیه، خیابان ورزش', phone: '09000000014', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی.', categorySlug: 'beauty', serviceSlug: 'waxing', rating: 4.6, reviewsCount: 55, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman beautiful' }, portfolio: [] },
  
  // Cooking
  { id: 4, name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.9, reviewsCount: 112, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { 
    id: 5, 
    name: 'شیرینی‌پزی بهار', 
    service: 'کیک و شیرینی', 
    location: 'ارومیه، خیابان کشاورز', 
    phone: '09000000005', 
    bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', 
    categorySlug: 'cooking', 
    serviceSlug: 'cakes-sweets', 
    rating: 4.8, 
    reviewsCount: 88, 
    profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' },
    portfolio: []
  },
  { id: 6, name: 'غذای سالم زهرا', service: 'غذای گیاهی', location: 'ارومیه، دانشکده', phone: '09000000006', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan', rating: 4.7, reviewsCount: 40, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'healthy food' }, portfolio: [] },
  { id: 15, name: 'فینگرفود شیک', service: 'فینگرفود', location: 'ارومیه، عمار', phone: '09000000015', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها.', categorySlug: 'cooking', serviceSlug: 'finger-food', rating: 4.9, reviewsCount: 75, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'party food' }, portfolio: [] },
  { id: 16, name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه، مولوی', phone: '09000000016', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی.', categorySlug: 'cooking', serviceSlug: 'homemade-bread', rating: 5.0, reviewsCount: 95, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'baker woman' }, portfolio: [] },
  
  // Tailoring
  { id: 7, name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه، خیابان مدرس', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 4.8, reviewsCount: 50, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { id: 8, name: 'طراحی پروین', service: 'تعمیرات تخصصی لباس', location: 'ارومیه، خیابان امام', phone: '09000000008', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair', rating: 4.7, reviewsCount: 35, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion designer' }, portfolio: [] },
  { id: 9, name: 'بوتیک افسانه', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان خیام', phone: '09000000009', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 4.9, reviewsCount: 80, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion boutique' }, portfolio: [] },
  { id: 18, name: 'خانه مد آناهیتا', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان حسنی', phone: '09000000018', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 5.0, reviewsCount: 33, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'evening dress' }, portfolio: [] },
  
  // Handicrafts
  { id: 10, name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.9, reviewsCount: 65, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { id: 11, name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه، خیابان بهار', phone: '09000000011', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', rating: 4.7, reviewsCount: 28, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { id: 12, name: 'بافتنی صبا', service: 'بافتنی‌ها', location: 'ارومیه، بازار', phone: '09000000012', bio: 'انواع لباس‌ها و وسایل بافتنی دستباف.', categorySlug: 'handicrafts', serviceSlug: 'termeh-kilim', rating: 4.8, reviewsCount: 48, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'knitting craft' }, portfolio: [] },
  { id: 19, name: 'هنر چرم لیلا', service: 'چرم‌دوزی', location: 'ارومیه، همافر', phone: '09000000019', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص.', categorySlug: 'handicrafts', serviceSlug: 'leather-crafts', rating: 4.9, reviewsCount: 58, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'leather goods' }, portfolio: [] },
  { id: 20, name: 'کارگاه شمع‌سازی رویا', service: 'شمع‌سازی', location: 'ارومیه، مدنی', phone: '09000000020', bio: 'انواع شمع‌های معطر و صابون‌های گیاهی دست‌ساز.', categorySlug: 'handicrafts', serviceSlug: 'candles-soaps', rating: 4.8, reviewsCount: 72, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'candle maker' }, portfolio: [] },
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

export const getAgreements = (): Agreement[] => {
    if (typeof window === 'undefined') return defaultAgreements;
    try {
        const stored = localStorage.getItem(AGREEMENTS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        } else {
            localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(defaultAgreements));
            return defaultAgreements;
        }
    } catch (e) {
        console.error("Failed to access localStorage for agreements", e);
        return defaultAgreements;
    }
}

export const saveAgreements = (updatedAgreements: Agreement[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(updatedAgreements));
    } catch (e) {
        console.error("Failed to save agreements to localStorage", e);
    }
}
