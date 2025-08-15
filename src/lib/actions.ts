'use server';

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, writeBatch, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAdminDb } from './firebase-admin';
import type { Provider, Review, User, Agreement } from './types';
import { revalidatePath } from 'next/cache';

// --- User Management ---
export const createUser = async (user: User): Promise<void> => {
  const db = await getAdminDb();
  await setDoc(doc(db, 'users', user.phone), user);
};

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const db = await getAdminDb();
  const userDocRef = doc(db, 'users', phone);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? (userDoc.data() as User) : null;
};

// --- Provider Management ---
export const createProvider = async (providerData: Omit<Provider, 'id'>): Promise<string> => {
  const db = await getAdminDb();
  const docRef = doc(collection(db, 'providers'));
  await setDoc(docRef, { ...providerData, id: docRef.id });
  revalidatePath('/');
  revalidatePath(`/services/${providerData.categorySlug}`);
  revalidatePath(`/services/${providerData.categorySlug}/${providerData.serviceSlug}`);
  return docRef.id;
};

export const getProviders = async (): Promise<Provider[]> => {
  const db = await getAdminDb();
  const providersCollection = collection(db, 'providers');
  const snapshot = await getDocs(providersCollection);
  return snapshot.docs.map(doc => doc.data() as Provider);
};

export const getProviderByPhone = async (phone: string): Promise<Provider | null> => {
  const db = await getAdminDb();
  const q = query(collection(db, "providers"), where("phone", "==", phone));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data() as Provider;
};

export const updateProvider = async (providerId: string, data: Partial<Provider>) => {
  const db = await getAdminDb();
  const providerRef = doc(db, 'providers', providerId);
  await updateDoc(providerRef, data);
  
  const providerDoc = await getDoc(providerRef);
    if (providerDoc.exists()) {
      const provider = providerDoc.data() as Provider;
      revalidatePath(`/profile`);
      revalidatePath(`/provider/${provider.phone}`);
    }
};

export const addPortfolioItemToProvider = async (providerId: string, item: { src: string, aiHint: string }) => {
    const db = await getAdminDb();
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, { portfolio: arrayUnion(item) });
    revalidatePath(`/profile`);
};

export const deletePortfolioItemFromProvider = async (providerId: string, itemSrc: string) => {
    const db = await getAdminDb();
    const providerRef = doc(db, 'providers', providerId);
    const providerDoc = await getDoc(providerRef);
    if (providerDoc.exists()) {
        const providerData = providerDoc.data() as Provider;
        const itemToDelete = providerData.portfolio.find(p => p.src === itemSrc);
        if(itemToDelete) {
          await updateDoc(providerRef, { portfolio: arrayRemove(itemToDelete) });
          revalidatePath(`/profile`);
        }
    }
};

export const updateProviderProfileImage = async (providerId: string, src: string) => {
    const db = await getAdminDb();
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, { 'profileImage.src': src });
    revalidatePath(`/profile`);
};

export const deleteProviderProfileImage = async (providerId: string) => {
    const db = await getAdminDb();
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, { 'profileImage.src': '' });
    revalidatePath(`/profile`);
};


// --- Review Management ---
export const createReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  const db = await getAdminDb();
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
      const providerData = providerDoc.data() as Provider;
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
  const providerData = (await getDoc(providerRef)).data();
  if (providerData) {
     revalidatePath(`/provider/${providerData.phone}`);
  }
  return reviewRef.id;
};

export const getReviewsForProvider = async (providerId: string): Promise<Review[]> => {
    const db = await getAdminDb();
    const q = query(collection(db, "reviews"), where("providerId", "==", providerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
        } as Review;
    });
};


// --- Agreement Management ---
export const addAgreementAction = async (providerPhone: string, customerPhone: string, customerName: string): Promise<Agreement> => {
  const db = await getAdminDb();
  const existingQuery = query(collection(db, 'agreements'), where('providerPhone', '==', providerPhone), where('customerPhone', '==', customerPhone));
  const existingSnapshot = await getDocs(existingQuery);
  if (!existingSnapshot.empty) {
    return existingSnapshot.docs[0].data() as Agreement;
  }
  
  const newAgreement: Omit<Agreement, 'id'> = {
    providerPhone,
    customerPhone,
    customerName,
    status: 'pending',
    requestedAt: new Date().toISOString()
  };

  const docRef = doc(collection(db, 'agreements'));
  await setDoc(docRef, { ...newAgreement, id: docRef.id });
  revalidatePath('/requests');
  return { ...newAgreement, id: docRef.id };
}

export const getAgreementsForUser = async (phone: string): Promise<Agreement[]> => {
    const db = await getAdminDb();
    const q = query(collection(db, "agreements"), where("customerPhone", "==", phone));
    const q2 = query(collection(db, "agreements"), where("providerPhone", "==", phone));

    const [customerSnapshot, providerSnapshot] = await Promise.all([getDocs(q), getDocs(q2)]);
    
    const agreements: Agreement[] = [];
    customerSnapshot.forEach(doc => agreements.push(doc.data() as Agreement));
    providerSnapshot.forEach(doc => agreements.push(doc.data() as Agreement));

    return agreements;
}

export const updateAgreementStatusAction = async (agreementId: string, status: 'confirmed'): Promise<void> => {
  const db = await getAdminDb();
  const agreementRef = doc(db, 'agreements', agreementId);
  const data: Partial<Agreement> = { status };

  if (status === 'confirmed') {
    data.confirmedAt = new Date().toISOString();

    const agreementDoc = await getDoc(agreementRef);
    if(agreementDoc.exists()){
        const providerPhone = agreementDoc.data().providerPhone;
        const provider = await getProviderByPhone(providerPhone);
        if(provider){
            const providerRef = doc(db, 'providers', provider.id);
            await updateDoc(providerRef, { agreementsCount: increment(1) });
        }
    }
  }
  
  await updateDoc(agreementRef, data);
  revalidatePath('/agreements');
  revalidatePath('/requests');
}
