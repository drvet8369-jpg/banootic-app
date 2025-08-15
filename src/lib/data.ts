import { db } from './firebase';
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    writeBatch,
    serverTimestamp,
    orderBy,
    limit,
    increment,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';
import type { Category, Provider, Service, Review, Agreement, User, Message } from './types';

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
  { name: 'خدمات ناخن', slug: 'manicure-pedicure', categorySlug: 'beauty' },
  { name: 'خدمات مو', slug: 'haircut-coloring', categorySlug: 'beauty' },
  { name: 'پاکسازی پوست', slug: 'facial-treatment', categorySlug: 'beauty' },
  { name: 'آرایش صورت', slug: 'makeup', categorySlug: 'beauty' },
  { name: 'اپیلاسیون', slug: 'waxing', categorySlug: 'beauty' },
  { name: 'غذای سنتی', slug: 'traditional-food', categorySlug: 'cooking' },
  { name: 'کیک و شیرینی', slug: 'cakes-sweets', categorySlug: 'cooking' },
  { name: 'غذای گیاهی', slug: 'vegetarian-vegan', categorySlug: 'cooking' },
  { name: 'فینگرفود', slug: 'finger-food', categorySlug: 'cooking' },
  { name: 'نان خانگی', slug: 'homemade-bread', categorySlug: 'cooking' },
  { name: 'دوخت سفارشی لباس', slug: 'custom-clothing', categorySlug: 'tailoring' },
  { name: 'مزون، لباس عروس و مجلسی', slug: 'fashion-design-mezon', categorySlug: 'tailoring' },
  { name: 'تعمیرات تخصصی لباس', slug: 'clothing-repair', categorySlug: 'tailoring' },
  { name: 'زیورآلات دست‌ساز', slug: 'handmade-jewelry', categorySlug: 'handicrafts' },
  { name: 'سفال تزئینی', slug: 'decorative-pottery', categorySlug: 'handicrafts' },
  { name: 'بافتنی‌ها', slug: 'termeh-kilim', categorySlug: 'handicrafts' },
  { name: 'چرم‌دوزی', slug: 'leather-crafts', categorySlug: 'handicrafts' },
  { name: 'شمع‌سازی', slug: 'candles-soaps', categorySlug: 'handicrafts' },
];


// --- User Management ---
export const createUser = async (user: User): Promise<void> => {
    const userRef = doc(db, 'users', user.phone);
    await setDoc(userRef, user);
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const userDocRef = doc(db, 'users', phone);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() as User : null;
};

// --- Provider Management ---
export const createProvider = async (providerData: Omit<Provider, 'id'>): Promise<string> => {
    const docRef = doc(collection(db, 'providers'));
    await setDoc(docRef, { ...providerData, id: docRef.id });
    return docRef.id;
}

export const getProviders = async (): Promise<Provider[]> => {
  const providersCollection = collection(db, 'providers');
  const snapshot = await getDocs(providersCollection);
  return snapshot.docs.map(doc => doc.data() as Provider);
};

export const getProviderByPhone = async (phone: string): Promise<Provider | null> => {
    const q = query(collection(db, "providers"), where("phone", "==", phone), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].data() as Provider;
}

export const updateProvider = async (providerId: string, data: Partial<Provider>) => {
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, data);
}

export const addPortfolioItemToProvider = async (providerId: string, item: { src: string, aiHint: string }) => {
    const providerRef = doc(db, 'providers', providerId);
    const providerDoc = await getDoc(providerRef);
    if (providerDoc.exists()) {
        const providerData = providerDoc.data() as Provider;
        const portfolio = providerData.portfolio || [];
        await updateDoc(providerRef, { portfolio: [...portfolio, item] });
    }
}

export const deletePortfolioItemFromProvider = async (providerId: string, itemSrc: string) => {
    const providerRef = doc(db, 'providers', providerId);
    const providerDoc = await getDoc(providerRef);
    if (providerDoc.exists()) {
        const providerData = providerDoc.data() as Provider;
        const updatedPortfolio = providerData.portfolio.filter(item => item.src !== itemSrc);
        await updateDoc(providerRef, { portfolio: updatedPortfolio });
    }
}

export const updateProviderProfileImage = async (providerId: string, src: string) => {
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, { 'profileImage.src': src });
}

export const deleteProviderProfileImage = async (providerId: string) => {
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, { 'profileImage.src': '' });
}


// --- Review Management ---
export const createReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  const providerRef = doc(db, 'providers', review.providerId);
  const reviewData = { 
      ...review, 
      createdAt: new Date().toISOString()
  };

  const batch = writeBatch(db);
  
  const reviewRef = doc(collection(db, 'reviews'));
  batch.set(reviewRef, reviewData);
  
  const providerDoc = await getDoc(providerRef);
  if (providerDoc.exists()) {
      const providerData = providerDoc.data();
      const currentReviewsCount = providerData.reviewsCount || 0;
      const currentRating = providerData.rating || 0;
      
      const newReviewsCount = currentReviewsCount + 1;
      const newRatingTotal = (currentRating * currentReviewsCount) + review.rating;
      const newAverageRating = parseFloat((newRatingTotal / newReviewsCount).toFixed(1));
      
      batch.update(providerRef, {
          reviewsCount: increment(1),
          rating: newAverageRating,
      });
  }

  await batch.commit();
  return reviewRef.id;
};

export const getReviewsForProvider = async (providerId: string): Promise<Review[]> => {
    const q = query(collection(db, "reviews"), where("providerId", "==", providerId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
        } as Review;
    });
}
