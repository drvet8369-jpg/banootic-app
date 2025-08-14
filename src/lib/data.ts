import type { Category, Provider, Service, Review, Message, Agreement } from './types';
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

const defaultProviders: Provider[] = [
  // Beauty
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.8, reviewsCount: 45, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', rating: 4.9, reviewsCount: 62, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { id: 3, name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', rating: 4.7, reviewsCount: 30, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { id: 13, name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه', phone: '09000000013', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', categorySlug: 'beauty', serviceSlug: 'makeup', rating: 5.0, reviewsCount: 25, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
  { id: 14, name: 'مرکز اپیلاسیون نازی', service: 'اپیلاسیون', location: 'ارومیه', phone: '09000000014', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی.', categorySlug: 'beauty', serviceSlug: 'waxing', rating: 4.6, reviewsCount: 55, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman beautiful' }, portfolio: [] },
  
  // Cooking
  { id: 4, name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.9, reviewsCount: 112, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { 
    id: 5, 
    name: 'شیرینی‌پزی بهار', 
    service: 'کیک و شیرینی', 
    location: 'ارومیه', 
    phone: '09000000005', 
    bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', 
    categorySlug: 'cooking', 
    serviceSlug: 'cakes-sweets', 
    rating: 4.8, 
    reviewsCount: 88, 
    profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' },
    portfolio: []
  },
  { id: 6, name: 'غذای سالم زهرا', service: 'غذای گیاهی', location: 'ارومیه', phone: '09000000006', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan', rating: 4.7, reviewsCount: 40, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'healthy food' }, portfolio: [] },
  { id: 15, name: 'فینگرفود شیک', service: 'فینگرفود', location: 'ارومیه', phone: '09000000015', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها.', categorySlug: 'cooking', serviceSlug: 'finger-food', rating: 4.9, reviewsCount: 75, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'party food' }, portfolio: [] },
  { id: 16, name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه', phone: '09000000016', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی.', categorySlug: 'cooking', serviceSlug: 'homemade-bread', rating: 5.0, reviewsCount: 95, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'baker woman' }, portfolio: [] },
  
  // Tailoring
  { id: 7, name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 4.8, reviewsCount: 50, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { id: 8, name: 'طراحی پروین', service: 'تعمیرات تخصصی لباس', location: 'ارومیه', phone: '09000000008', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair', rating: 4.7, reviewsCount: 35, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion designer' }, portfolio: [] },
  { id: 9, name: 'بوتیک افسانه', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه', phone: '09000000009', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 4.9, reviewsCount: 80, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion boutique' }, portfolio: [] },
  { id: 18, name: 'خانه مد آناهیتا', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه', phone: '09000000018', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 5.0, reviewsCount: 33, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'evening dress' }, portfolio: [] },
  
  // Handicrafts
  { id: 10, name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.9, reviewsCount: 65, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { id: 11, name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه', phone: '09000000011', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', rating: 4.7, reviewsCount: 28, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { id: 12, name: 'بافتنی صبا', service: 'بافتنی‌ها', location: 'ارومیه', phone: '09000000012', bio: 'انواع لباس‌ها و وسایل بافتنی دستباف.', categorySlug: 'handicrafts', serviceSlug: 'termeh-kilim', rating: 4.8, reviewsCount: 48, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'knitting craft' }, portfolio: [] },
  { id: 19, name: 'هنر چرم لیلا', service: 'چرم‌دوزی', location: 'ارومیه', phone: '09000000019', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص.', categorySlug: 'handicrafts', serviceSlug: 'leather-crafts', rating: 4.9, reviewsCount: 58, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'leather goods' }, portfolio: [] },
  { id: 20, name: 'کارگاه شمع‌سازی رویا', service: 'شمع‌سازی', location: 'ارومیه', phone: '09000000020', bio: 'انواع شمع‌های معطر و صابون‌های گیاهی دست‌ساز.', categorySlug: 'handicrafts', serviceSlug: 'candles-soaps', rating: 4.8, reviewsCount: 72, profileImage: { src: 'https://placehold.co/400x400.png', aiHint: 'candle maker' }, portfolio: [] },
];

/**
 * Initializes the default provider data in Firestore if it doesn't exist.
 * This is a one-time operation.
 */
export async function initializeDefaultProviders() {
    const settingsDocRef = doc(db, 'settings', 'initialData');
    const settingsDoc = await getDoc(settingsDocRef);
  
    if (!settingsDoc.exists() || !settingsDoc.data().providersInitialized) {
      console.log('Initializing default providers in Firestore...');
      const batch = writeBatch(db);
      defaultProviders.forEach(provider => {
        const docRef = doc(db, 'providers', provider.phone);
        batch.set(docRef, provider);
      });
      await batch.commit();
  
      await setDoc(settingsDocRef, { providersInitialized: true }, { merge: true });
      console.log('Default providers initialized successfully.');
    }
}
  
// --- Firestore Data Functions ---

export const getProviders = async (): Promise<Provider[]> => {
    try {
        await initializeDefaultProviders(); // Ensure data is seeded
        const querySnapshot = await getDocs(collection(db, 'providers'));
        return querySnapshot.docs.map(doc => doc.data() as Provider);
    } catch (error) {
        console.error("Error fetching providers from Firestore:", error);
        return []; // Return empty array on error
    }
};

export const saveProviders = async (providers: Provider[]) => {
    try {
        const batch = writeBatch(db);
        providers.forEach(provider => {
            const docRef = doc(db, 'providers', provider.phone);
            batch.set(docRef, provider, { merge: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error saving providers to Firestore:", error);
    }
};

export const getReviews = async (): Promise<Review[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'reviews'));
        return querySnapshot.docs.map(doc => doc.data() as Review);
    } catch (error) {
        console.error("Error fetching reviews from Firestore:", error);
        return [];
    }
};

export const saveReviews = async (reviews: Review[]) => {
    try {
        const batch = writeBatch(db);
        reviews.forEach(review => {
            const docRef = doc(db, 'reviews', review.id);
            batch.set(docRef, review);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error saving reviews to Firestore:", error);
    }
};

export const getAgreements = async (): Promise<Agreement[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'agreements'));
        return querySnapshot.docs.map(doc => doc.data() as Agreement);
    } catch (error) {
        console.error("Error fetching agreements from Firestore:", error);
        return [];
    }
};

export const saveAgreements = async (agreements: Agreement[]) => {
    try {
        const batch = writeBatch(db);
        agreements.forEach(agreement => {
            const docRef = doc(db, 'agreements', agreement.id);
            batch.set(docRef, agreement);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error saving agreements to Firestore:", error);
    }
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'chats', chatId, 'messages'));
      return querySnapshot.docs
        .map(doc => doc.data() as Message)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      return [];
    }
  };
  
export const saveChatMessage = async (chatId: string, message: Message): Promise<void> => {
    try {
        await setDoc(doc(db, 'chats', chatId, 'messages', message.id), message);
    } catch (error) {
        console.error("Error saving chat message:", error);
    }
};

export const getInboxData = async (userPhone: string): Promise<Record<string, any>> => {
    try {
      const docRef = doc(db, 'inboxes', userPhone);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : {};
    } catch (error) {
      console.error("Error fetching inbox data:", error);
      return {};
    }
};
  
export const updateInboxData = async (userPhone: string, chatId: string, chatData: any): Promise<void> => {
    try {
      const docRef = doc(db, 'inboxes', userPhone);
      await setDoc(docRef, { [chatId]: chatData }, { merge: true });
    } catch (error) {
      console.error("Error updating inbox data:", error);
    }
};
