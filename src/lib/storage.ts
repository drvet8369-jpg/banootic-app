// This file is the SINGLE SOURCE OF TRUTH for all localStorage operations.
// No other file should directly access localStorage for app data.

import type { Provider, Review, Agreement, Category, Service } from './types';
import type { User } from '@/context/AuthContext';

// --- Default Data ---
// This data is used ONLY on the very first load to populate the app.

const defaultCategories: Category[] = [
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

const defaultServices: Service[] = [
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
  { name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن با سال‌ها تجربه در ارائه جدیدترین متدهای کاشت و ژلیش. ما به سلامت و زیبایی دستان شما اهمیت می‌دهیم.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.8, reviewsCount: 45, agreementsCount: 60, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [{src: 'https://placehold.co/400x400.png', aiHint: 'nail art'}] },
  { name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن. با استفاده از بهترین مواد و تکنیک‌های روز دنیا، رنگ و مدل موی دلخواه شما را به ارمغان می‌آوریم.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', rating: 4.9, reviewsCount: 62, agreementsCount: 85, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست. با ما پوستی شاداب و جوان داشته باشید.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', rating: 4.7, reviewsCount: 30, agreementsCount: 40, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه', phone: '09000000013', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها. درخشش شما در مجالس، تخصص ماست.', categorySlug: 'beauty', serviceSlug: 'makeup', rating: 5.0, reviewsCount: 25, agreementsCount: 30, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
  { name: 'مرکز اپیلاسیون نازی', service: 'اپیلاسیون', location: 'ارومیه', phone: '09000000014', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی در محیطی آرام و کاملا استریل.', categorySlug: 'beauty', serviceSlug: 'waxing', rating: 4.6, reviewsCount: 55, agreementsCount: 75, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman beautiful' }, portfolio: [] },
  { name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل با طعم و عطر بی‌نظیر. طعم غذای خانگی واقعی را با ما تجربه کنید.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.9, reviewsCount: 112, agreementsCount: 150, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { name: 'شیرینی پزی بهار', service: 'کیک و شیرینی', location: 'ارومیه', phone: '09000000005', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص. شیرینی لحظات شما تخصص ماست.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets', rating: 4.8, reviewsCount: 88, agreementsCount: 110, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' }, portfolio: [] },
  { name: 'غذای سالم زهرا', service: 'غذای گیاهی', location: 'ارومیه', phone: '09000000006', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل. سالم زندگی کنید، سالم غذا بخورید.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan', rating: 4.7, reviewsCount: 40, agreementsCount: 50, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'healthy food' }, portfolio: [] },
  { name: 'فینگرفود شیک', service: 'فینگرفود', location: 'ارومیه', phone: '09000000015', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها و دورهمی‌های شما. میزبان شایسته‌ای باشید.', categorySlug: 'cooking', serviceSlug: 'finger-food', rating: 4.9, reviewsCount: 75, agreementsCount: 90, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'party food' }, portfolio: [] },
  { name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه', phone: '09000000016', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی با بهترین مواد اولیه و بدون افزودنی‌های مضر.', categorySlug: 'cooking', serviceSlug: 'homemade-bread', rating: 5.0, reviewsCount: 95, agreementsCount: 125, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'baker woman' }, portfolio: [] },
  { name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی. طراحی و دوخت مطابق با سلیقه و اندام شما.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 4.8, reviewsCount: 50, agreementsCount: 65, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { name: 'طراحی پروین', service: 'تعمیرات تخصصی لباس', location: 'ارومیه', phone: '09000000008', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس. لباس‌های قدیمی خود را نو کنید.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair', rating: 4.7, reviewsCount: 35, agreementsCount: 45, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion designer' }, portfolio: [] },
  { name: 'بوتیک افسانه', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه', phone: '09000000009', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند. خاص بودن را تجربه کنید.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 4.9, reviewsCount: 80, agreementsCount: 95, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion boutique' }, portfolio: [] },
  { name: 'خانه مد آناهیتا', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه', phone: '09000000018', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص و مطابق با جدیدترین ترندهای دنیا.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 5.0, reviewsCount: 33, agreementsCount: 40, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'evening dress' }, portfolio: [] },
  { name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق و هنر. هر قطعه، یک داستان.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.9, reviewsCount: 65, agreementsCount: 80, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه', phone: '09000000011', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما. هنر خاک را به خانه بیاورید.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', rating: 4.7, reviewsCount: 28, agreementsCount: 35, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { name: 'بافتنی صبا', service: 'بافتنی‌ها', location: 'ارومیه', phone: '09000000012', bio: 'انواع لباس‌ها و وسایل بافتنی دستباف با طرح‌ها و رنگ‌های متنوع. گرما و زیبایی در هر گره.', categorySlug: 'handicrafts', serviceSlug: 'termeh-kilim', rating: 4.8, reviewsCount: 48, agreementsCount: 60, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'knitting craft' }, portfolio: [] },
  { name: 'هنر چرم لیلا', service: 'چرم‌دوزی', location: 'ارومیه', phone: '09000000019', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص و کیفیت بالا. دوام و زیبایی در کنار هم.', categorySlug: 'handicrafts', serviceSlug: 'leather-crafts', rating: 4.9, reviewsCount: 58, agreementsCount: 75, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'leather goods' }, portfolio: [] },
  { name: 'کارگاه شمع‌سازی رویا', service: 'شمع‌سازی', location: 'ارومیه', phone: '09000000020', bio: 'انواع شمع‌های معطر و صابون‌های گیاهی دست‌ساز برای آرامش و زیبایی محیط شما.', categorySlug: 'handicrafts', serviceSlug: 'candles-soaps', rating: 4.8, reviewsCount: 72, agreementsCount: 90, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'candle maker' }, portfolio: [] },
];

// --- Generic LocalStorage Handler ---
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
    // If no data, initialize with default and return it
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Failed to get/parse ${key} from localStorage. Returning default.`, error);
    return defaultValue;
  }
}

function saveStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage.`, error);
  }
}

// --- Storage Keys ---
const PROVIDERS_KEY = 'banootik-providers';
const REVIEWS_KEY = 'banootik-reviews';
const AGREEMENTS_KEY = 'banootik-agreements';
const USERS_KEY = 'banootik-users'; // Unified key for all users
const CHATS_KEY_PREFIX = 'banootik_chat_';
const INBOX_KEY = 'banootik_inbox_chats';

// --- Public API for Data Access ---

// Static Data (doesn't change)
export const categories: Category[] = defaultCategories;
export const services: Service[] = defaultServices;

// Providers
export const getProviders = (): Provider[] => getStoredData<Provider[]>(PROVIDERS_KEY, defaultProviders);
export const saveProviders = (data: Provider[]): void => saveStoredData<Provider[]>(PROVIDERS_KEY, data);

// Reviews
export const getReviews = (): Review[] => getStoredData<Review[]>(REVIEWS_KEY, []);
export const saveReviews = (data: Review[]): void => saveStoredData<Review[]>(REVIEWS_KEY, data);

// Agreements
export const getAgreements = (): Agreement[] => getStoredData<Agreement[]>(AGREEMENTS_KEY, []);
export const saveAgreements = (data: Agreement[]): void => saveStoredData<Agreement[]>(AGREEMENTS_KEY, data);

// --- Smart User Management (Unified) ---
export const getAllUsers = (): User[] => {
    // The default user list is derived from the default providers list, ensuring all providers are also users.
    const defaultInitialUsers: User[] = defaultProviders.map(p => ({
        name: p.name,
        phone: p.phone,
        accountType: 'provider'
    }));
    return getStoredData<User[]>(USERS_KEY, defaultInitialUsers);
};
export const saveAllUsers = (data: User[]): void => saveStoredData<User[]>(USERS_KEY, data);

// --- Chat & Inbox ---
export const getChatMessages = (chatId: string): any[] => getStoredData<any[]>(`${CHATS_KEY_PREFIX}${chatId}`, []);
export const saveChatMessages = (chatId: string, messages: any[]): void => saveStoredData<any[]>(`${CHATS_KEY_PREFIX}${chatId}`, messages);

export const getInboxData = (): Record<string, any> => getStoredData<Record<string, any>>(INBOX_KEY, {});
export const saveInboxData = (data: Record<string, any>): void => saveStoredData<Record<string, any>>(INBOX_KEY, data);
