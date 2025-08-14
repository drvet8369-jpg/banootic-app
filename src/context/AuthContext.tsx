'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    collection, 
    doc, 
    onSnapshot, 
    setDoc, 
    writeBatch, 
    getDocs, 
    query, 
    orderBy,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Provider, User, Agreement, Review, Message } from '@/lib/types';
import { initializeDefaultProviders } from '@/lib/data';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  providers: Provider[];
  reviews: Review[];
  agreements: Agreement[];
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  addProvider: (provider: Provider) => Promise<void>;
  updateProvider: (provider: Provider) => Promise<void>;
  addReview: (review: Review) => Promise<void>;
  addAgreement: (provider: Provider, currentUser: User) => Promise<void>;
  updateAgreementStatus: (agreementId: string, status: 'confirmed' | 'rejected') => Promise<void>;
  sendChatMessage: (chatId: string, message: Message, receiver: {phone: string, name: string}, currentUser: User) => Promise<void>;
  editChatMessage: (chatId: string, messageId: string, newText: string) => Promise<void>;
  markChatAsRead: (chatId: string, userPhone: string) => Promise<void>;
  getInboxForUser: (userPhone: string) => Promise<Record<string, any>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on initial mount
  useEffect(() => {
    const storedUserJSON = localStorage.getItem('banootik-user');
    if (storedUserJSON) {
      try {
        setUser(JSON.parse(storedUserJSON));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('banootik-user');
      }
    }
  }, []);

  // Set up Firestore listeners for real-time updates
  useEffect(() => {
    setIsLoading(true);

    const initializeData = async () => {
        await initializeDefaultProviders();

        const unsubProviders = onSnapshot(collection(db, "providers"), (snapshot) => {
            const newProviders = snapshot.docs.map(doc => doc.data() as Provider);
            setProviders(newProviders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to providers:", error);
            setIsLoading(false);
        });

        const unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
            setReviews(snapshot.docs.map(doc => doc.data() as Review));
        });

        const unsubAgreements = onSnapshot(collection(db, "agreements"), (snapshot) => {
            setAgreements(snapshot.docs.map(doc => doc.data() as Agreement));
        });

        return () => {
            unsubProviders();
            unsubReviews();
            unsubAgreements();
        };
    };

    const cleanupPromise = initializeData();
    
    return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup());
    };
}, []);

  const login = (userData: User) => {
    localStorage.setItem('banootik-user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('banootik-user');
    setUser(null);
    router.push('/');
  };
  
  const recalculateProviderRating = async (providerId: number) => {
    const providerRef = doc(db, 'providers', providers.find(p=>p.id === providerId)?.phone || '');
    if(!providerRef) return;

    const reviewsQuery = query(collection(db, "reviews"));
    const agreementsQuery = query(collection(db, "agreements"));
    
    const [reviewsSnapshot, agreementsSnapshot] = await Promise.all([getDocs(reviewsQuery), getDocs(agreementsQuery)]);

    const allReviews = reviewsSnapshot.docs.map(d => d.data() as Review);
    const allAgreements = agreementsSnapshot.docs.map(d => d.data() as Agreement);

    const providerReviews = allReviews.filter(r => r.providerId === providerId);
    const totalRatingFromReviews = providerReviews.reduce((acc, r) => acc + r.rating, 0);

    const confirmedAgreementsCount = allAgreements.filter(a => a.providerId === providerId && a.status === 'confirmed').length;
    const agreementBonus = confirmedAgreementsCount * 0.1;
      
    const totalScore = totalRatingFromReviews + agreementBonus;
    const totalItemsForAverage = providerReviews.length;

    let newRating = 0;
    if (totalItemsForAverage > 0) {
      newRating = Math.min(5, parseFloat((totalScore / totalItemsForAverage).toFixed(2)));
    } else if (agreementBonus > 0) {
      newRating = Math.min(5, parseFloat((agreementBonus * 2.5).toFixed(2)));
    }

    await updateDoc(providerRef, {
        rating: newRating,
        reviewsCount: providerReviews.length
    });
  };
  
  const addProvider = async (provider: Provider) => {
    await setDoc(doc(db, "providers", provider.phone), provider);
  };

  const updateProvider = async (provider: Provider) => {
    await setDoc(doc(db, "providers", provider.phone), provider, { merge: true });
  };
  
  const addReview = async (review: Review) => {
    await setDoc(doc(db, "reviews", review.id), review);
    await recalculateProviderRating(review.providerId);
  };

  const addAgreement = async (provider: Provider, currentUser: User) => {
    const newAgreement: Agreement = {
      id: `agree_${Date.now()}`,
      providerId: provider.id,
      providerPhone: provider.phone,
      providerName: provider.name,
      customerPhone: currentUser.phone,
      customerName: currentUser.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "agreements", newAgreement.id), newAgreement);
  };

  const updateAgreementStatus = async (agreementId: string, status: 'confirmed' | 'rejected') => {
    const agreementRef = doc(db, 'agreements', agreementId);
    const agreementToUpdate = agreements.find(a => a.id === agreementId);
    if (!agreementToUpdate) return;
    
    await updateDoc(agreementRef, { status, createdAt: new Date().toISOString() });
    
    if (status === 'confirmed') {
      await recalculateProviderRating(agreementToUpdate.providerId);
    }
  };

  const sendChatMessage = async (chatId: string, message: Message, receiver: {phone: string, name: string}, currentUser: User) => {
    const batch = writeBatch(db);
    
    // 1. Add new message
    const newMessageRef = doc(collection(db, "chats", chatId, "messages"));
    batch.set(newMessageRef, { ...message, id: newMessageRef.id });

    // 2. Update sender's inbox
    const senderInboxRef = doc(db, "inboxes", currentUser.phone);
    const senderChatUpdate = {
        [`${chatId}.id`]: chatId,
        [`${chatId}.lastMessage`]: message.text,
        [`${chatId}.updatedAt`]: message.createdAt,
        [`${chatId}.members`]: [currentUser.phone, receiver.phone],
        [`${chatId}.participants.${currentUser.phone}`]: { name: currentUser.name, unreadCount: 0 },
        [`${chatId}.participants.${receiver.phone}`]: { name: receiver.name },
    };
    batch.set(senderInboxRef, senderChatUpdate, { merge: true });
    
    // 3. Update receiver's inbox
    const receiverInboxRef = doc(db, "inboxes", receiver.phone);
    const receiverInboxDoc = await getDoc(receiverInboxRef);
    const receiverInboxData = receiverInboxDoc.data() || {};
    const currentUnread = receiverInboxData[chatId]?.participants?.[receiver.phone]?.unreadCount || 0;

    const receiverChatUpdate = {
        [`${chatId}.id`]: chatId,
        [`${chatId}.lastMessage`]: message.text,
        [`${chatId}.updatedAt`]: message.createdAt,
        [`${chatId}.members`]: [currentUser.phone, receiver.phone],
        [`${chatId}.participants.${currentUser.phone}`]: { name: currentUser.name },
        [`${chatId}.participants.${receiver.phone}`]: { name: receiver.name, unreadCount: currentUnread + 1 },
    };
     batch.set(receiverInboxRef, receiverChatUpdate, { merge: true });

    await batch.commit();
  }

  const editChatMessage = async (chatId: string, messageId: string, newText: string) => {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, { text: newText, isEdited: true });

      // This part is complex without a proper data model. For now, we'll assume last message updates are handled elsewhere if needed.
  };

  const markChatAsRead = async (chatId: string, userPhone: string) => {
      const inboxRef = doc(db, 'inboxes', userPhone);
      await updateDoc(inboxRef, {
        [`${chatId}.participants.${userPhone}.unreadCount`]: 0
      });
  };

  const getInboxForUser = async (userPhone: string): Promise<Record<string, any>> => {
      const docRef = doc(db, 'inboxes', userPhone);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : {};
  }
  
  const value = {
    isLoggedIn: !!user,
    user,
    providers,
    reviews,
    agreements,
    isLoading,
    login,
    logout,
    addProvider,
    updateProvider,
    addReview,
    addAgreement,
    updateAgreementStatus,
    sendChatMessage,
    editChatMessage,
    markChatAsRead,
    getInboxForUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
