
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders, saveProviders, getReviews, saveReviews, getInboxData, saveInboxData, getChatMessages, saveChatMessages, getAgreements, saveAgreements } from '@/lib/data';
import type { Provider, Review, Message, User, Agreement } from '@/lib/types';
import { appReducer, AppState, AppAction, initialState } from './reducer';

// Define the shape of the context value
interface AppContextType extends AppState {
  login: (name: string, phone: string) => void;
  logout: () => void;
  addProvider: (provider: Provider) => void;
  updateProviderData: (phone: string, updateFn: (provider: Provider) => void) => boolean;
  addReview: (review: Review) => void;
  saveMessage: (chatId: string, message: Message, receiverPhone: string, receiverName: string) => void;
  updateMessage: (chatId: string, messageId: string, newText: string) => void;
  markChatAsRead: (chatId: string, userPhone: string) => void;
  getUnreadCount: (userPhone: string) => number;
  getUserChats: (userPhone: string) => any[];
  getOtherPersonDetails: (phone: string) => { id: string | number; name: string; phone: string; profileImage?: { src: string; aiHint?: string; }; } | null;
  getMessagesForChat: (chatId: string) => Message[];
  addAgreement: (provider: Provider) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed' | 'rejected') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'honarbanoo-app-channel';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();

  // Create a wrapped dispatch function that also broadcasts actions.
  const wrappedDispatch = useCallback((action: AppAction) => {
    // Dispatch the action locally first
    dispatch(action);

    // If the action is coming from a broadcast, don't broadcast it again.
    if (action.isBroadcast) {
      return;
    }
    
    // Broadcast the action to other tabs
    try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage(action);
        channel.close();
    } catch (error) {
        console.error("Broadcast channel error:", error);
    }
  }, []);


  // Effect to handle incoming broadcast messages
  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
         wrappedDispatch({ ...event.data, isBroadcast: true });
      }
    };
    channel.addEventListener('message', handleMessage);

    // Initial state load
    wrappedDispatch({ type: 'INITIALIZE_STATE' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [wrappedDispatch]);


  const login = (name: string, phone: string) => {
    const isProvider = state.providers.some(p => p.phone === phone);
    const accountType = isProvider ? 'provider' : 'customer';
    const user: User = { name, phone, accountType };
    wrappedDispatch({ type: 'LOGIN', payload: user });
  };

  const logout = () => {
    wrappedDispatch({ type: 'LOGOUT' });
    if(window.location.pathname !== '/') {
        router.push('/');
    }
  };

  const addProvider = (provider: Provider) => {
    wrappedDispatch({ type: 'ADD_PROVIDER', payload: provider });
  };

  const updateProviderData = (phone: string, updateFn: (provider: Provider) => void): boolean => {
    const providerToUpdate = state.providers.find(p => p.phone === phone);
    if (providerToUpdate) {
      // Create a deep copy to avoid direct mutation before dispatching
      const updatedProvider = JSON.parse(JSON.stringify(providerToUpdate));
      updateFn(updatedProvider);
      wrappedDispatch({ type: 'UPDATE_PROVIDER', payload: updatedProvider });
      return true;
    }
    return false;
  };

  const addReview = (review: Review) => {
    wrappedDispatch({ type: 'ADD_REVIEW', payload: review });
  };
  
  const saveMessage = (chatId: string, message: Message, receiverPhone: string, receiverName: string) => {
    if(!state.user) return;
    wrappedDispatch({type: 'ADD_MESSAGE', payload: { chatId, message, receiverPhone, receiverName, currentUser: state.user }})
  }
  
  const updateMessage = (chatId: string, messageId: string, newText: string) => {
    wrappedDispatch({ type: 'UPDATE_MESSAGE', payload: { chatId, messageId, newText } });
  }

  const markChatAsRead = (chatId: string, userPhone: string) => {
    wrappedDispatch({ type: 'MARK_CHAT_AS_READ', payload: { chatId, userPhone } });
  };
  
  const getUnreadCount = useCallback((userPhone: string): number => {
    if (!state.inboxData) return 0;
    return Object.values(state.inboxData)
      .filter((chat: any) => chat.members?.includes(userPhone))
      .reduce((acc: number, chat: any) => acc + (chat.participants?.[userPhone]?.unreadCount || 0), 0);
  }, [state.inboxData]);
  
  const getUserChats = useCallback((userPhone: string): any[] => {
     if (!state.inboxData) return [];
     return Object.values(state.inboxData)
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
        .filter((chat): chat is any => chat !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.inboxData]);

  const getOtherPersonDetails = useCallback((phone: string) => {
    const provider = state.providers.find(p => p.phone === phone);
    if(provider) {
        return { ...provider, id: provider.phone };
    }
    if (state.inboxData) {
        for (const chatId in state.inboxData) {
            const chat = state.inboxData[chatId];
            if (chat.participants && chat.participants[phone]) {
                return { id: phone, name: chat.participants[phone].name, phone: phone };
            }
        }
    }
    // Fallback for customer who hasn't chatted yet
    const storedUser = localStorage.getItem('honarbanoo-user');
    if(storedUser) {
        const user: User = JSON.parse(storedUser);
        if (user.phone === phone) {
            return { id: phone, name: user.name, phone: phone };
        }
    }
    return { id: phone, name: `مشتری ${phone.slice(-4)}`, phone: phone };
  }, [state.providers, state.inboxData]);

  const getMessagesForChat = useCallback((chatId: string): Message[] => {
      return getChatMessages(chatId);
  }, []);

  const addAgreement = (provider: Provider) => {
      if (!state.user) return;
      wrappedDispatch({ type: 'ADD_AGREEMENT', payload: { provider, currentUser: state.user }});
  }

  const updateAgreementStatus = (agreementId: string, status: 'confirmed' | 'rejected') => {
      wrappedDispatch({ type: 'UPDATE_AGREEMENT_STATUS', payload: { agreementId, status } });
  }

  return (
    <AppContext.Provider value={{ 
        ...state, 
        login,
        logout,
        addProvider,
        updateProviderData,
        addReview,
        saveMessage,
        updateMessage,
        markChatAsRead,
        getUnreadCount,
        getUserChats,
        getOtherPersonDetails,
        getMessagesForChat,
        addAgreement,
        updateAgreementStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAuth = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
