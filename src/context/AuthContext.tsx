'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { appReducer, initialState, AppAction, AppState } from './reducer';
import type { User, Provider, Review, Agreement } from '@/lib/types';
import { saveProviders } from '@/lib/data';

const BROADCAST_CHANNEL_NAME = 'honarbanoo_auth_channel';

interface AuthContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  login: (userData: User) => void;
  logout: () => void;
  addProvider: (providerData: Provider) => void;
  updateProviderData: (providerPhone: string, updateFn: (provider: Provider) => void) => boolean;
  addReview: (reviewData: Review) => void;
  addMessage: (chatId: string, messageText: string, otherPerson: { phone: string, name: string }) => void;
  updateMessage: (chatId: string, messageId: string, newText: string) => void;
  markChatAsRead: (chatId: string) => void;
  getUserChats: (userPhone: string) => any[];
  addAgreement: (provider: Provider) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed' | 'rejected') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined') {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_STATE' });
  }, []);
  
  useEffect(() => {
    if (channel) {
      channel.onmessage = (event) => {
        const action = event.data as AppAction;
        if (!action.isBroadcast) {
          dispatch({ ...action, isBroadcast: true });
        }
      };
    }
    return () => {
      channel?.close();
    }
  }, []);

  const broadcastAction = (action: AppAction) => {
    dispatch(action);
    if (channel && !action.isBroadcast) {
        channel.postMessage({ ...action, isBroadcast: true });
    }
  };

  const login = (userData: User) => {
    broadcastAction({ type: 'LOGIN', payload: userData });
  };

  const logout = () => {
    broadcastAction({ type: 'LOGOUT' });
    router.push('/');
  };

  const addProvider = (providerData: Provider) => {
    broadcastAction({ type: 'ADD_PROVIDER', payload: providerData });
  };
  
  const updateProviderData = useCallback((providerPhone: string, updateFn: (provider: Provider) => void): boolean => {
    const providerToUpdate = state.providers.find(p => p.phone === providerPhone);
    if (providerToUpdate) {
        const updatedProvider = { ...providerToUpdate };
        updateFn(updatedProvider);
        broadcastAction({ type: 'UPDATE_PROVIDER', payload: updatedProvider });
        return true;
    }
    return false;
  }, [state.providers]);

  const addReview = (reviewData: Review) => {
    broadcastAction({ type: 'ADD_REVIEW', payload: reviewData });
  };

  const addMessage = (chatId: string, messageText: string, otherPerson: { phone: string, name: string }) => {
    if (!state.user) return;
    const message = {
      id: `${Date.now()}-${Math.random()}`,
      text: messageText,
      senderId: state.user.phone,
      createdAt: new Date().toISOString(),
    };
    broadcastAction({ type: 'ADD_MESSAGE', payload: { 
        chatId, 
        message,
        receiverPhone: otherPerson.phone,
        receiverName: otherPerson.name,
        currentUser: state.user 
    }});
  };

  const updateMessage = (chatId: string, messageId: string, newText: string) => {
    broadcastAction({ type: 'UPDATE_MESSAGE', payload: { chatId, messageId, newText } });
  };
  
  const markChatAsRead = (chatId: string) => {
    if (!state.user) return;
    broadcastAction({ type: 'MARK_CHAT_AS_READ', payload: { chatId, userPhone: state.user.phone }});
  };

  const getUserChats = useCallback((userPhone: string) => {
     if (!userPhone) return [];
     return Object.values(state.inboxData)
        .filter((chat: any) => chat.members?.includes(userPhone))
        .map((chat: any) => {
            if (!chat.participants || !chat.members) return null;

            const otherMemberId = chat.members.find((id: string) => id !== userPhone);
            if (!otherMemberId) return null;
            
            const otherMemberInfo = chat.participants[otherMemberId];
            const selfInfo = chat.participants[userPhone];

            const otherMemberName = otherMemberInfo?.name || `کاربر ${otherMemberId.slice(-4)}`;

            return {
                id: chat.id,
                otherMemberId: otherMemberId,
                otherMemberName: otherMemberName,
                lastMessage: chat.lastMessage || '',
                updatedAt: chat.updatedAt,
                unreadCount: selfInfo?.unreadCount || 0,
            };
        })
        .filter((chat): chat is any => chat !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.inboxData]);

  const addAgreement = (provider: Provider) => {
    if (!state.user) return;
    broadcastAction({ type: 'ADD_AGREEMENT', payload: { provider, currentUser: state.user } });
  };

  const updateAgreementStatus = (agreementId: string, status: 'confirmed' | 'rejected') => {
    broadcastAction({ type: 'UPDATE_AGREEMENT_STATUS', payload: { agreementId, status } });
  }

  const value: AuthContextType = {
    ...state,
    dispatch: broadcastAction, // technically we expose broadcastAction as dispatch
    login,
    logout,
    addProvider,
    updateProviderData,
    addReview,
    addMessage,
    updateMessage,
    markChatAsRead,
    getUserChats,
    addAgreement,
    updateAgreementStatus,
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
