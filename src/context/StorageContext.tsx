'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { 
    getProviders as getProvidersFromStorage, 
    saveProviders,
    getReviews as getReviewsFromStorage,
    saveReviews,
    getAgreements as getAgreementsFromStorage,
    saveAgreements,
    getChatMessages as getChatMessagesFromStorage,
    saveChatMessages,
    getInboxData as getInboxDataFromStorage,
    saveInboxData
} from '@/lib/storage';
import type { Provider, Review, Agreement, Message } from '@/lib/types';
import { useAuth } from './AuthContext';

interface StorageContextType {
  providers: Provider[];
  reviews: Review[];
  agreements: Agreement[];
  inboxData: Record<string, any>;
  isStorageLoading: boolean;
  
  getProviderByPhone: (phone: string) => Provider | undefined;
  addProvider: (provider: Provider) => void;
  updateProviderData: (phone: string, updateFn: (provider: Provider) => void) => boolean;
  
  getReviewsForProvider: (providerPhone: string) => Review[];
  addReview: (review: Review) => void;
  
  getAgreementsForProvider: (providerPhone: string) => Agreement[];
  getAgreementsForCustomer: (customerPhone: string) => Agreement[];
  addAgreement: (agreement: Agreement) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed') => void;

  getChatMessages: (chatId: string) => Message[];
  getOtherPersonDetails: (phone: string) => { id: string | number; name: string; phone: string; profileImage?: { src: string; aiHint?: string; }; } | null;
  saveMessage: (chatId: string, message: Message, receiverPhone: string, receiverName: string) => void;
  updateMessage: (chatId: string, messageId: string, newText: string) => void;
  markChatAsRead: (chatId: string, userPhone: string) => void;
  getUserChats: (userPhone: string) => any[];
  getUnreadCount: (userPhone: string) => number;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [providers, setProvidersState] = useState<Provider[]>([]);
  const [reviews, setReviewsState] = useState<Review[]>([]);
  const [agreements, setAgreementsState] = useState<Agreement[]>([]);
  const [inboxData, setInboxDataState] = useState<Record<string, any>>({});
  const [isStorageLoading, setIsStorageLoading] = useState(true);

  // Unified load and sync function
  const loadAllDataFromStorage = useCallback(() => {
    try {
      const providersData = getProvidersFromStorage();
      const reviewsData = getReviewsFromStorage();
      const agreementsData = getAgreementsFromStorage();
      const inboxDataVals = getInboxDataFromStorage();
      
      setProvidersState(providersData);
      setReviewsState(reviewsData);
      setAgreementsState(agreementsData);
      setInboxDataState(inboxDataVals);

    } catch (error) {
      console.error("Error loading data from storage", error);
    } finally {
      setIsStorageLoading(false);
    }
  }, []);

  // Initial load and setup listener for storage changes across tabs
  useEffect(() => {
    loadAllDataFromStorage();
    
    const handleStorageChange = (e: StorageEvent) => {
      // Check if any of our keys changed
      if (['honarbanoo-providers', 'honarbanoo-reviews', 'honarbanoo-agreements', 'honarbanoo_inbox_chats'].includes(e.key || '') || e.key?.startsWith('honarbanoo_chat_')) {
          loadAllDataFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadAllDataFromStorage]);
  
  const getProviderByPhone = useCallback((phone: string) => providers.find(p => p.phone === phone), [providers]);
  
  const addProvider = useCallback((provider: Provider) => {
    const newState = [...providers, provider];
    saveProviders(newState);
    setProvidersState(newState);
  }, [providers]);

  const updateProviderData = useCallback((phone: string, updateFn: (provider: Provider) => void) => {
    const newState = JSON.parse(JSON.stringify(providers));
    const index = newState.findIndex((p: Provider) => p.phone === phone);
    if (index > -1) {
        updateFn(newState[index]);
        saveProviders(newState);
        setProvidersState(newState);
        return true;
    }
    return false;
  }, [providers]);

  const getReviewsForProvider = useCallback((providerPhone: string) => {
    return reviews.filter(r => r.providerId === providerPhone).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews]);
  
  const addReview = useCallback((review: Review) => {
    const newReviews = [...reviews, review];
    saveReviews(newReviews);
    setReviewsState(newReviews);
    
    updateProviderData(review.providerId, p => {
        const providerReviews = newReviews.filter(r => r.providerId === review.providerId);
        const totalRating = providerReviews.reduce((acc, r) => acc + r.rating, 0);
        p.reviewsCount = providerReviews.length;
        p.rating = parseFloat((totalRating / p.reviewsCount).toFixed(1));
    });
  }, [reviews, updateProviderData]);

  const getAgreementsForProvider = useCallback((providerPhone: string) => {
      return agreements.filter(a => a.providerPhone === providerPhone).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [agreements]);
  
  const getAgreementsForCustomer = useCallback((customerPhone: string) => {
      return agreements.filter(a => a.customerPhone === customerPhone).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [agreements]);
  
  const addAgreement = useCallback((agreement: Agreement) => {
      const newAgreements = [...agreements, agreement];
      saveAgreements(newAgreements);
      setAgreementsState(newAgreements);
  }, [agreements]);
  
  const updateAgreementStatus = useCallback((agreementId: string, status: 'confirmed') => {
    const newAgreements = JSON.parse(JSON.stringify(agreements));
    const index = newAgreements.findIndex((a: Agreement) => a.id === agreementId);
    if (index > -1 && newAgreements[index].status !== 'confirmed') {
        newAgreements[index].status = status;
        saveAgreements(newAgreements);
        setAgreementsState(newAgreements);

        const providerPhone = newAgreements[index].providerPhone;
        updateProviderData(providerPhone, p => {
            p.agreementsCount = (p.agreementsCount || 0) + 1;
        });
    }
  }, [agreements, updateProviderData]);

  const getChatMessages = useCallback((chatId: string) => {
    return getChatMessagesFromStorage(chatId);
  }, []);
  
  const getOtherPersonDetails = useCallback((phone: string) => {
    const provider = getProviderByPhone(phone);
    if(provider) {
        return { ...provider, id: provider.phone };
    }
    return { id: phone, name: `مشتری ${phone.slice(-4)}`, phone: phone };
  }, [getProviderByPhone]);

  const updateMessage = useCallback((chatId: string, messageId: string, newText: string) => {
    const chatMessages = getChatMessagesFromStorage(chatId);
    const updatedMessages = chatMessages.map(msg => msg.id === messageId ? {...msg, text: newText, isEdited: true} : msg);
    saveChatMessages(chatId, updatedMessages);
    
    const newInboxData = getInboxDataFromStorage();
    if(newInboxData[chatId]) {
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (lastMessage?.id === messageId) {
        newInboxData[chatId].lastMessage = newText;
        saveInboxData(newInboxData);
        setInboxDataState(newInboxData);
      }
    }
    // Manually trigger a storage event for the current tab to react
    window.dispatchEvent(new StorageEvent('storage', { key: `honarbanoo_chat_${chatId}` }));
  }, []);

  const saveMessage = useCallback((chatId: string, message: Message, receiverPhone: string, receiverName: string) => {
      if(!user) return;
      
      const chatMessages = getChatMessagesFromStorage(chatId);
      const updatedMessages = [...chatMessages, message];
      saveChatMessages(chatId, updatedMessages);

      const newInboxData = getInboxDataFromStorage();
      const currentChat = newInboxData[chatId] || {
          id: chatId,
          members: [user.phone, receiverPhone],
          participants: {
              [user.phone]: { name: user.name, unreadCount: 0 },
              [receiverPhone]: { name: receiverName, unreadCount: 0 }
          }
      };

      currentChat.lastMessage = message.text;
      currentChat.updatedAt = new Date().toISOString();
      if(currentChat.participants[receiverPhone]) {
          currentChat.participants[receiverPhone].unreadCount = (currentChat.participants[receiverPhone].unreadCount || 0) + 1;
      } else {
          currentChat.participants[receiverPhone] = { name: receiverName, unreadCount: 1};
      }
      
      if (!currentChat.participants[user.phone]) {
          currentChat.participants[user.phone] = { name: user.name, unreadCount: 0 };
      }

      newInboxData[chatId] = currentChat;
      saveInboxData(newInboxData);
      setInboxDataState(newInboxData);
      // Manually trigger a storage event for the current tab to react
      window.dispatchEvent(new StorageEvent('storage', { key: 'honarbanoo_inbox_chats' }));

  }, [user]);

  const markChatAsRead = useCallback((chatId: string, userPhone: string) => {
      const newInboxData = getInboxDataFromStorage();
      if(newInboxData[chatId]?.participants?.[userPhone]) {
          if (newInboxData[chatId].participants[userPhone].unreadCount > 0) {
              newInboxData[chatId].participants[userPhone].unreadCount = 0;
              saveInboxData(newInboxData);
              setInboxDataState(newInboxData);
              // Manually trigger a storage event for the current tab to react
              window.dispatchEvent(new StorageEvent('storage', { key: 'honarbanoo_inbox_chats' }));
          }
      }
  }, []);

  const getUserChats = useCallback((userPhone: string) => {
    return Object.values(inboxData)
        .filter((chat: any) => chat.members?.includes(userPhone))
        .map((chat: any) => {
            const otherMemberId = chat.members.find((id: string) => id !== userPhone);
            if (!otherMemberId) return null;
            const otherMemberInfo = chat.participants[otherMemberId];
            const selfInfo = chat.participants[userPhone];
            return {
                id: chat.id,
                otherMemberId: otherMemberId,
                otherMemberName: otherMemberInfo?.name || `کاربر ${otherMemberId.slice(-4)}`,
                lastMessage: chat.lastMessage || '',
                updatedAt: chat.updatedAt,
                unreadCount: selfInfo?.unreadCount || 0,
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [inboxData]);

  const getUnreadCount = useCallback((userPhone: string) => {
    return Object.values(inboxData)
        .filter((chat: any) => chat.members?.includes(userPhone))
        .reduce((acc: number, chat: any) => {
            const selfInfo = chat.participants?.[userPhone];
            return acc + (selfInfo?.unreadCount || 0);
        }, 0);
  }, [inboxData]);

  return (
    <StorageContext.Provider value={{
      providers,
      reviews,
      agreements,
      inboxData,
      isStorageLoading,
      getProviderByPhone,
      addProvider,
      updateProviderData,
      getReviewsForProvider,
      addReview,
      getAgreementsForProvider,
      getAgreementsForCustomer,
      addAgreement,
      updateAgreementStatus,
      getChatMessages,
      getOtherPersonDetails,
      saveMessage,
      updateMessage,
      markChatAsRead,
      getUserChats,
      getUnreadCount
    }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
