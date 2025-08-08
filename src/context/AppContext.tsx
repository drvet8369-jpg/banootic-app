
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders, saveProviders, getReviews, saveReviews, getAgreements, saveAgreements, getInboxData, saveInboxData, getChatMessages, saveChatMessages } from '@/lib/storage';
import type { Provider, Review, Agreement, Message, User } from '@/lib/types';
import { appReducer, AppState, AppAction, initialState } from './reducer';

// Define the shape of the context value
interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  login: (name: string, phone: string) => void;
  logout: () => void;
  addProvider: (provider: Provider) => void;
  updateProviderData: (phone: string, updateFn: (provider: Provider) => void) => boolean;
  addReview: (review: Review) => void;
  addAgreement: (agreement: Agreement) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed') => void;
  saveMessage: (chatId: string, message: Message, receiverPhone: string, receiverName: string) => void;
  updateMessage: (chatId: string, messageId: string, newText: string) => void;
  markChatAsRead: (chatId: string, userPhone: string) => void;
  getUnreadCount: (userPhone: string) => number;
  getUserChats: (userPhone: string) => any[];
  getOtherPersonDetails: (phone: string) => { id: string | number; name: string; phone: string; profileImage?: { src: string; aiHint?: string; }; } | null;
  getMessagesForChat: (chatId: string) => Message[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'honarbanoo-app-channel';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();

  // Effect to handle incoming broadcast messages
  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handleMessage = (event: MessageEvent) => {
      // Dispatch the action received from another tab
      // The 'isBroadcast' flag prevents an infinite loop
      if (event.data && event.data.type) {
         dispatch({ ...event.data, isBroadcast: true });
      }
    };
    channel.addEventListener('message', handleMessage);

    // Initial state load
    dispatch({ type: 'INITIALIZE_STATE' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  // Create a wrapped dispatch function that also broadcasts actions.
  const wrappedDispatch = useCallback((action: AppAction) => {
    // Dispatch the action locally first
    dispatch(action);

    // If the action is coming from a broadcast, don't broadcast it again.
    if (action.isBroadcast) {
      return;
    }
    
    // Broadcast the action to other tabs
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage(action);
    channel.close();
  }, []);


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
  
  const addAgreement = (agreement: Agreement) => {
    wrappedDispatch({ type: 'ADD_AGREEMENT', payload: agreement });
  };

  const updateAgreementStatus = (agreementId: string, status: 'confirmed') => {
    wrappedDispatch({ type: 'UPDATE_AGREEMENT_STATUS', payload: { agreementId, status } });
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
    return Object.values(state.inboxData)
      .filter((chat: any) => chat.members?.includes(userPhone))
      .reduce((acc: number, chat: any) => acc + (chat.participants?.[userPhone]?.unreadCount || 0), 0);
  }, [state.inboxData]);
  
  const getUserChats = useCallback((userPhone: string): any[] => {
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
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.inboxData]);

  const getOtherPersonDetails = useCallback((phone: string) => {
    const provider = state.providers.find(p => p.phone === phone);
    if(provider) {
        return { ...provider, id: provider.phone };
    }
    // Attempt to find the name from inbox data if they are a customer
    for (const chatId in state.inboxData) {
        const chat = state.inboxData[chatId];
        if (chat.participants && chat.participants[phone]) {
            return { id: phone, name: chat.participants[phone].name, phone: phone };
        }
    }
    return { id: phone, name: `مشتری ${phone.slice(-4)}`, phone: phone };
  }, [state.providers, state.inboxData]);

  const getMessagesForChat = useCallback((chatId: string): Message[] => {
      return getChatMessages(chatId);
  }, []);

  return (
    <AppContext.Provider value={{ 
        ...state, 
        dispatch: wrappedDispatch,
        login,
        logout,
        addProvider,
        updateProviderData,
        addReview,
        addAgreement,
        updateAgreementStatus,
        saveMessage,
        updateMessage,
        markChatAsRead,
        getUnreadCount,
        getUserChats,
        getOtherPersonDetails,
        getMessagesForChat
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAuth = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AppProvider');
  }
  return context;
};
