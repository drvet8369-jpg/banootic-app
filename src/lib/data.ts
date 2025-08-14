import type { Category, Provider, Service, Review } from './types';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// This file now acts as the primary interface for interacting with Firestore.
// All data fetching and saving logic will be centralized here.

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

/**
 * Fetches all providers from the 'providers' collection in Firestore.
 * This is now a simple fetch operation without any initialization logic.
 * @returns A promise that resolves to an array of Provider objects.
 */
export const getProviders = async (): Promise<Provider[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'providers'));
        return querySnapshot.docs.map(doc => doc.data() as Provider);
    } catch (error) {
        console.error("Error fetching providers from Firestore:", error);
        // In a real app, you might want to show a user-facing error.
        // For now, we return an empty array to prevent the app from crashing.
        return [];
    }
};

/**
 * Fetches a single provider document by their phone number (which is their ID).
 * @param phone The phone number of the provider to fetch.
 * @returns A promise that resolves to the Provider object or null if not found.
 */
export const getProviderByPhone = async (phone: string): Promise<Provider | null> => {
    try {
        const docRef = doc(db, 'providers', phone);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as Provider) : null;
    } catch (error) {
        console.error(`Error fetching provider with phone ${phone}:`, error);
        throw error; // Re-throw the error to be handled by the caller.
    }
};

/**
 * Fetches all reviews from the 'reviews' collection.
 * @returns A promise that resolves to an array of Review objects.
 */
export const getReviews = async (): Promise<Review[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'reviews'));
        return querySnapshot.docs.map(doc => doc.data() as Review);
    } catch (error) {
        console.error("Error fetching reviews from Firestore:", error);
        return [];
    }
};
