'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Agreement, Provider, Message } from '@/lib/types';
import { 
    getProviders,
    getAgreementsForProvider, 
    getAgreementsForCustomer,
    updateAgreement,
    createAgreement,
    getInboxForUser,
    createChatMessage,
    updateChatMessage,
    setChatRead
} from '@/lib/data';

export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  agreements: Agreement[];
  providers: Provider[];
  addAgreement: (providerPhone: string) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed') => void;
  getInboxForUser: (userPhone: string) => Promise<any>;
  sendChatMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt'>, otherUser: {phone: string, name: string}, sender: User) => Promise<void>;
  editChatMessage: (chatId: string, messageId: string, newText: string) => Promise<void>;
  markChatAsRead: (chatId: string, userPhone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const router = useRouter();

  const fetchAppData = useCallback(async (currentUser: User | null) => {
    setIsLoading(true);
    try {
        const allProviders = await getProviders();
        setProviders(allProviders);

        if (currentUser) {
            let userAgreements: Agreement[] = [];
            if (currentUser.accountType === 'provider') {
                userAgreements = await getAgreementsForProvider(currentUser.phone);
            } else {
                userAgreements = await getAgreementsForCustomer(currentUser.phone);
            }
            setAgreements(userAgreements);
        } else {
            setAgreements([]);
        }
    } catch (error) {
      console.error("Failed to fetch app data from Firestore", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let storedUser: User | null = null;
    try {
      const storedUserJSON = localStorage.getItem('banoutique-user');
      if (storedUserJSON) {
        storedUser = JSON.parse(storedUserJSON);
        setUser(storedUser);
      }
    } catch (e) {
        console.error("Could not parse user from localStorage", e);
        localStorage.removeItem('banoutique-user');
    }
    fetchAppData(storedUser);
  }, [fetchAppData]);


  const login = (userData: User) => {
    try {
      localStorage.setItem('banoutique-user', JSON.stringify(userData));
      setUser(userData);
      fetchAppData(userData); 
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('banoutique-user');
      setUser(null);
      setAgreements([]);
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  };

  const addAgreement = async (providerPhone: string) => {
    if (!user || user.accountType !== 'customer') return;
    
    const existingAgreement = agreements.find(a => a.providerPhone === providerPhone && a.customerPhone === user.phone);
    if(existingAgreement) return;

    try {
        const newAgreement = await createAgreement(providerPhone, user.phone, user.name);
        setAgreements(prev => [...prev, newAgreement]);
    } catch (error) {
        console.error("Failed to create agreement", error);
    }
  };
  
  const updateAgreementStatus = async (agreementId: string, status: 'confirmed') => {
    try {
      const confirmedAt = new Date().toISOString();
      await updateAgreement(agreementId, { status, confirmedAt });
      setAgreements(prev => prev.map(a => 
        a.id === agreementId ? { ...a, status, confirmedAt } : a
      ));
    } catch(e) {
      console.error("Failed to update agreement", e);
    }
  };


  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        login, 
        logout, 
        isLoading, 
        agreements, 
        providers,
        addAgreement, 
        updateAgreementStatus,
        getInboxForUser,
        sendChatMessage: createChatMessage,
        editChatMessage: updateChatMessage,
        markChatAsRead: setChatRead,
    }}>
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
