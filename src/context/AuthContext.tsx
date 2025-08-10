'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProviders, saveProviders, getReviews, saveReviews, getInboxData, saveInboxData, getChatMessages, saveChatMessages, getAgreements, saveAgreements } from '@/lib/data';
import type { Provider, Review, Message, User, Agreement } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';


interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  providers: Provider[];
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On initial load, try to hydrate the user from localStorage.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('honarbanoo-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setProviders(getProviders());
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      localStorage.removeItem('honarbanoo-user');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    try {
      const userToSave = { ...userData };
      localStorage.setItem('honarbanoo-user', JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('honarbanoo-user');
      setUser(null);
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        providers,
        login, 
        logout 
    }}>
      {isLoading ? (
         <div className="flex items-center justify-center min-h-screen bg-background">
            <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      ) : children}
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
