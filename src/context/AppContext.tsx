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

  // Effect to initialize state from localStorage and set up broadcast channel listener
  useEffect(() => {
    dispatch({ type: 'INITIALIZE_STATE' });

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handleMessage = (event: MessageEvent) => {
      // Dispatch the action received from another tab
      // The 'isBroadcast' flag prevents an infinite loop
      if (event.data && event.data.type) {
         dispatch({ ...event.data, isBroadcast: true });
      }
    };
    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  // Effect to broadcast actions to other tabs
  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const originalDispatch = dispatch;

    (dispatch as any) = (action: AppAction) => {
      originalDispatch(action);
      // Only broadcast if the action did not come from a broadcast itself
      if (!action.isBroadcast) {
        channel.postMessage(action);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const login = (name: string, phone: string) => {
    const isProvider = state.providers.some(p => p.phone === phone);
    const accountType = isProvider ? 'provider' : 'customer';
    const user: User = { name, phone, accountType };
    dispatch({ type: 'LOGIN', payload: user });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    if(window.location.pathname !== '/') {
        router.push('/');
    }
  };

  const addProvider = (provider: Provider) => {
    dispatch({ type: 'ADD_PROVIDER', payload: provider });
  };

  const updateProviderData = (phone: string, updateFn: (provider: Provider) => void): boolean => {
    const providerToUpdate = state.providers.find(p => p.phone === phone);
    if (providerToUpdate) {
      // Create a deep copy to avoid direct mutation before dispatching
      const updatedProvider = JSON.parse(JSON.stringify(providerToUpdate));
      updateFn(updatedProvider);
      dispatch({ type: 'UPDATE_PROVIDER', payload: updatedProvider });
      return true;
    }
    return false;
  };

  const addReview = (review: Review) => {
    dispatch({ type: 'ADD_REVIEW', payload: review });
  };
  
  const addAgreement = (agreement: Agreement) => {
    dispatch({ type: 'ADD_AGREEMENT', payload: agreement });
  };

  const updateAgreementStatus = (agreementId: string, status: 'confirmed') => {
    dispatch({ type: 'UPDATE_AGREEMENT_STATUS', payload: { agreementId, status } });
  };
  
  const saveMessage = (chatId: string, message: Message, receiverPhone: string, receiverName: string) => {
    if(!state.user) return;
    dispatch({type: 'ADD_MESSAGE', payload: { chatId, message, receiverPhone, receiverName, currentUser: state.user }})
  }
  
  const updateMessage = (chatId: string, messageId: string, newText: string) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { chatId, messageId, newText } });
  }

  const markChatAsRead = (chatId: string, userPhone: string) => {
    dispatch({ type: 'MARK_CHAT_AS_READ', payload: { chatId, userPhone } });
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
    return { id: phone, name: `مشتری ${phone.slice(-4)}`, phone: phone };
  }, [state.providers]);

  const getMessagesForChat = useCallback((chatId: string): Message[] => {
      // Since messages are not part of the global state, we fetch them directly.
      // This could be optimized if needed.
      return getChatMessages(chatId);
  }, []);

  return (
    <AppContext.Provider value={{ 
        ...state, 
        dispatch,
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
