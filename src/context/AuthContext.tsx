'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithCustomToken, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, writeBatch, serverTimestamp, setDoc, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Provider, Review, Message as MessageType, Agreement } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithPhoneNumber: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  providers: Provider[];
  reviews: Review[];
  agreements: Agreement[];
  sendChatMessage: (chatId: string, message: Omit<MessageType, 'id' | 'createdAt'>, receiver: {phone: string, name: string}, sender: User) => Promise<void>;
  editChatMessage: (chatId: string, messageId: string, newText: string) => Promise<void>;
  markChatAsRead: (chatId: string, userPhone: string) => Promise<void>;
  getInboxForUser: (userPhone: string) => Promise<any>;
  requestAgreement: (provider: Provider, currentUser: User) => Promise<void>;
  updateAgreementStatus: (agreementId: string, status: 'confirmed' | 'rejected') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAppData = useCallback(async () => {
    try {
        const providersQuery = query(collection(db, 'providers'));
        const reviewsQuery = query(collection(db, 'reviews'));
        const agreementsQuery = query(collection(db, 'agreements'));

        const [providersSnapshot, reviewsSnapshot, agreementsSnapshot] = await Promise.all([
            getDocs(providersQuery),
            getDocs(reviewsQuery),
            getDocs(agreementsQuery)
        ]);

        const providersData = providersSnapshot.docs.map(doc => doc.data() as Provider);
        const reviewsData = reviewsSnapshot.docs.map(doc => doc.data() as Review);
        const agreementsData = agreementsSnapshot.docs.map(doc => doc.data() as Agreement);
        
        setProviders(providersData);
        setReviews(reviewsData);
        setAgreements(agreementsData);
    } catch (error) {
        console.error("Failed to fetch app data:", error);
        toast({ title: "خطا", description: "امکان بارگذاری داده‌های برنامه وجود ندارد.", variant: "destructive"});
    }
  }, [toast]);
  

  const handleUserAuth = useCallback(async (firebaseUser: FirebaseUser | null) => {
    setIsLoading(true);
    await fetchAppData(); // Fetch data regardless of login state
    if (firebaseUser) {
      const providerDocRef = doc(db, "providers", firebaseUser.uid);
      const providerDocSnap = await getDoc(providerDocRef);
      
      let userProfile: User;

      if (providerDocSnap.exists()) {
        const providerData = providerDocSnap.data() as Provider;
        userProfile = {
          id: firebaseUser.uid,
          phone: providerData.phone,
          name: providerData.name,
          accountType: 'provider',
        };
      } else {
        userProfile = {
          id: firebaseUser.uid,
          phone: firebaseUser.phoneNumber ? `0${firebaseUser.phoneNumber.substring(3)}` : 'N/A',
          name: firebaseUser.displayName || `کاربر`,
          accountType: 'customer',
        };
      }
      setUser(userProfile);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [fetchAppData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUserAuth);
    return () => unsubscribe();
  }, [handleUserAuth]);
  
  useEffect(() => {
    // Add real-time listeners for agreements to update UI across app
    const q = query(collection(db, "agreements"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agreementsData = snapshot.docs.map(doc => doc.data() as Agreement);
      setAgreements(agreementsData);
    });
    return () => unsubscribe();
  }, []);

  const loginWithPhoneNumber = async (phone: string) => {
    setIsLoading(true);
    try {
       const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to get custom token');
        }
        const { token } = await response.json();
        await signInWithCustomToken(auth, token);
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendChatMessage = async (chatId: string, message: Omit<MessageType, 'id' | 'createdAt'>, receiver: {phone: string, name: string}, sender: User) => {
      const batch = writeBatch(db);
      
      const messageColRef = collection(db, "chats", chatId, "messages");
      const newMessageRef = doc(messageColRef); // Auto-generate ID
      batch.set(newMessageRef, { ...message, createdAt: serverTimestamp() });

      const senderInboxRef = doc(db, 'inboxes', sender.phone);
      const receiverInboxRef = doc(db, 'inboxes', receiver.phone);
      
      const receiverInboxSnap = await getDoc(receiverInboxRef);
      const receiverInboxData = receiverInboxSnap.exists() ? receiverInboxSnap.data() : {};
      const currentUnreadCount = receiverInboxData[chatId]?.participants?.[receiver.phone]?.unreadCount || 0;

      const updatePayload = {
        id: chatId,
        lastMessage: message.text,
        updatedAt: new Date().toISOString(),
        members: [sender.phone, receiver.phone],
        participants: {
            [sender.phone]: { name: sender.name, unreadCount: 0 },
            [receiver.phone]: { name: receiver.name, unreadCount: currentUnreadCount + 1 }
        }
      };

      batch.set(senderInboxRef, { [chatId]: updatePayload }, { merge: true });
      batch.set(receiverInboxRef, { [chatId]: updatePayload }, { merge: true });

      await batch.commit();
  };

  const editChatMessage = async (chatId: string, messageId: string, newText: string) => {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await updateDoc(messageRef, { text: newText, isEdited: true, updatedAt: serverTimestamp() });
  };
  
  const markChatAsRead = async (chatId: string, userPhone: string) => {
      const inboxRef = doc(db, 'inboxes', userPhone);
      await setDoc(inboxRef, { [chatId]: { participants: { [userPhone]: { unreadCount: 0 } } } }, { merge: true });
  }
  
  const getInboxForUser = async (userPhone: string) => {
      const inboxDocRef = doc(db, 'inboxes', userPhone);
      const docSnap = await getDoc(inboxDocRef);
      return docSnap.exists() ? docSnap.data() : {};
  }

  const requestAgreement = async (provider: Provider, currentUser: User) => {
      const agreementId = `agree_${Date.now()}`;
      const newAgreement: Agreement = {
        id: agreementId,
        providerId: provider.id,
        providerPhone: provider.phone,
        providerName: provider.name,
        customerPhone: currentUser.phone,
        customerName: currentUser.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
      };
      const agreementDocRef = doc(db, 'agreements', agreementId);
      await setDoc(agreementDocRef, newAgreement);
  };

  const updateAgreementStatus = async (agreementId: string, status: 'confirmed' | 'rejected') => {
      const agreementDocRef = doc(db, 'agreements', agreementId);
      await updateDoc(agreementDocRef, { status });
  };


  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoggedIn: !!user, 
        isLoading, 
        loginWithPhoneNumber, 
        logout,
        providers,
        reviews,
        agreements,
        sendChatMessage,
        editChatMessage,
        markChatAsRead,
        getInboxForUser,
        requestAgreement,
        updateAgreementStatus
    }}>
      {isLoading ? (
         <div className="flex justify-center items-center h-screen w-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
         </div>
      ) : (
        children
      )}
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
