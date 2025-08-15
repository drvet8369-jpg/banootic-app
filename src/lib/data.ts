import { db } from './firebase';
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    writeBatch,
    Timestamp,
    serverTimestamp,
    orderBy,
    limit,
    increment,
} from 'firebase/firestore';
import type { Category, Provider, Service, Review, Agreement, User, Message, Chat } from './types';

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

// --- Firestore Collection References ---
const usersCollection = collection(db, 'users');
const providersCollection = collection(db, 'providers');
const reviewsCollection = collection(db, 'reviews');
const agreementsCollection = collection(db, 'agreements');
const inboxesCollection = collection(db, 'inboxes');

// --- User Management ---
export const createUser = async (user: User): Promise<void> => {
  await setDoc(doc(usersCollection, user.id), user);
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const userDocRef = doc(usersCollection, phone);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() as User : null;
};

// --- Provider Management ---
export const createProvider = async (providerData: Omit<Provider, 'id'>): Promise<string> => {
    const docRef = await addDoc(providersCollection, providerData);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
}

export const getProviders = async (): Promise<Provider[]> => {
  const snapshot = await getDocs(providersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
};

export const getProviderByPhone = async (phone: string): Promise<Provider | null> => {
    const q = query(providersCollection, where("phone", "==", phone), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Provider;
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
  const reviewData = { ...review, createdAt: serverTimestamp() };
  const docRef = await addDoc(reviewsCollection, reviewData);
  // Also, update provider's rating
  const providerRef = doc(db, 'providers', review.providerId);
  const providerDoc = await getDoc(providerRef);
  if (providerDoc.exists()) {
      const providerData = providerDoc.data();
      const newReviewsCount = (providerData.reviewsCount || 0) + 1;
      const newRating = ((providerData.rating || 0) * (providerData.reviewsCount || 0) + review.rating) / newReviewsCount;
      await updateDoc(providerRef, {
          reviewsCount: newReviewsCount,
          rating: parseFloat(newRating.toFixed(1)),
      });
  }
  return docRef.id;
};

export const getReviewsForProvider = async (providerId: string): Promise<Review[]> => {
    const q = query(reviewsCollection, where("providerId", "==", providerId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

// --- Agreement Management ---
export const createAgreement = async (providerPhone: string, customerPhone: string, customerName: string): Promise<Agreement> => {
    const agreementData: Omit<Agreement, 'id'> = {
        providerPhone,
        customerPhone,
        customerName,
        status: 'pending',
        requestedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(agreementsCollection, agreementData);
    return { id: docRef.id, ...agreementData };
};

export const updateAgreement = async (agreementId: string, data: Partial<Agreement>) => {
    await updateDoc(doc(agreementsCollection, agreementId), data);
     if (data.status === 'confirmed') {
        const agreementDoc = await getDoc(doc(agreementsCollection, agreementId));
        if (agreementDoc.exists()) {
            const providerPhone = agreementDoc.data().providerPhone;
            const provider = await getProviderByPhone(providerPhone);
            if(provider) {
                const providerRef = doc(db, 'providers', provider.id);
                await updateDoc(providerRef, { agreementsCount: increment(1) });
            }
        }
    }
};

export const getAgreementsForProvider = async (providerPhone: string): Promise<Agreement[]> => {
    const q = query(agreementsCollection, where("providerPhone", "==", providerPhone));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Agreement));
}

export const getAgreementsForCustomer = async (customerPhone: string): Promise<Agreement[]> => {
    const q = query(agreementsCollection, where("customerPhone", "==", customerPhone));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Agreement));
}

// --- Chat & Inbox Management ---

export const getInboxForUser = async (userPhone: string): Promise<any> => {
    const inboxRef = doc(db, 'inboxes', userPhone);
    const docSnap = await getDoc(inboxRef);
    return docSnap.exists() ? docSnap.data() : {};
}

export const createChatMessage = async (chatId: string, message: Omit<Message, 'id'>, otherUser: {phone: string, name: string}, sender: User) => {
    const batch = writeBatch(db);
    const messageRef = doc(collection(db, "chats", chatId, "messages"));
    batch.set(messageRef, message);
    
    // Update sender's inbox
    const senderInboxRef = doc(db, 'inboxes', sender.phone);
    batch.set(senderInboxRef, {
        [chatId]: {
            id: chatId,
            members: [sender.phone, otherUser.phone],
            participants: {
                [sender.phone]: { name: sender.name, unreadCount: 0 },
                [otherUser.phone]: { name: otherUser.name, unreadCount: 0 }
            },
            lastMessage: message.text,
            updatedAt: message.createdAt
        }
    }, { merge: true });

    // Update receiver's inbox
    const receiverInboxRef = doc(db, 'inboxes', otherUser.phone);
    const receiverFieldPath = `${chatId}.participants.${otherUser.phone}.unreadCount`;
    batch.set(receiverInboxRef, {
        [chatId]: {
             id: chatId,
            members: [sender.phone, otherUser.phone],
            participants: {
                [sender.phone]: { name: sender.name, unreadCount: 0 },
                [otherUser.phone]: { name: otherUser.name, unreadCount: 0 }
            },
            lastMessage: message.text,
            updatedAt: message.createdAt
        },
        [receiverFieldPath]: increment(1)
    }, { merge: true });


    await batch.commit();
};


export const updateChatMessage = async (chatId: string, messageId: string, newText: string) => {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await updateDoc(messageRef, {
        text: newText,
        isEdited: true
    });
}

export const setChatRead = async (chatId: string, userPhone: string) => {
    const inboxRef = doc(db, "inboxes", userPhone);
    const fieldPath = `${chatId}.participants.${userPhone}.unreadCount`;
    await updateDoc(inboxRef, {
        [fieldPath]: 0
    });
}
