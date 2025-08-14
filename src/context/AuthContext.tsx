'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders, saveProviders, getReviews, saveReviews, getAgreements, saveAgreements, getInboxData, saveInboxData } from '@/lib/data';
import type { Provider, User, Agreement, Review } from '@/lib/types';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  providers: Provider[];
  reviews: Review[];
  agreements: Agreement[];
  inboxData: Record<string, any>;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateProviderData: (updateFn: (providers: Provider[]) => Provider[]) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed' | 'rejected') => void;
  addAgreement: (provider: Provider, currentUser: User) => void;
  addReview: (review: Review) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [inboxData, setInboxData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadStateFromLocalStorage = useCallback(() => {
    setIsLoading(true);
    try {
      const storedProviders = getProviders();
      const storedReviews = getReviews();
      const storedAgreements = getAgreements();
      const storedInbox = getInboxData();
      const storedUserJSON = localStorage.getItem('honarbanoo-user');
      
      let currentUser: User | null = null;
      if (storedUserJSON) {
        currentUser = JSON.parse(storedUserJSON);
      }

      setProviders(storedProviders);
      setReviews(storedReviews);
      setAgreements(storedAgreements);
      setInboxData(storedInbox);
      setUser(currentUser);
      
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStateFromLocalStorage();
    
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key?.startsWith('honarbanoo-')) {
            loadStateFromLocalStorage();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', loadStateFromLocalStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadStateFromLocalStorage);
    };
  }, [loadStateFromLocalStorage]);

  const login = (userData: User) => {
    localStorage.setItem('honarbanoo-user', JSON.stringify(userData));
    setUser(userData);
    window.dispatchEvent(new Event('storage'));
  };

  const logout = () => {
    localStorage.removeItem('honarbanoo-user');
    setUser(null);
    router.push('/');
    window.dispatchEvent(new Event('storage'));
  };
  
  const updateProviderData = (updateFn: (providers: Provider[]) => Provider[]) => {
      const newProviders = updateFn(providers);
      saveProviders(newProviders);
      setProviders(newProviders);
      window.dispatchEvent(new Event('storage'));
  };
  
  const addAgreement = (provider: Provider, currentUser: User) => {
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
        const newAgreements = [...agreements, newAgreement];
        saveAgreements(newAgreements);
        setAgreements(newAgreements);
        window.dispatchEvent(new Event('storage'));
  }

  const updateAgreementStatus = (agreementId: string, status: 'confirmed' | 'rejected') => {
      let providerToUpdateRating: Provider | undefined;
      const newAgreements = agreements.map(a => {
          if(a.id === agreementId){
              if (status === 'confirmed') {
                  const provider = providers.find(p => p.id === a.providerId);
                  if (provider) providerToUpdateRating = provider;
              }
              return { ...a, status, createdAt: new Date().toISOString() };
          }
          return a;
      });
      saveAgreements(newAgreements);
      setAgreements(newAgreements);

      if (providerToUpdateRating) {
          recalculateProviderRating(providerToUpdateRating.id, newAgreements);
      }
      window.dispatchEvent(new Event('storage'));
  };

  const recalculateProviderRating = (providerId: number, currentAgreements: Agreement[]) => {
      const allProviders = getProviders();
      const providerIndex = allProviders.findIndex(p => p.id === providerId);
      if (providerIndex === -1) return;

      const providerReviews = getReviews().filter(r => r.providerId === providerId);
      const totalRatingFromReviews = providerReviews.reduce((acc, r) => acc + r.rating, 0);

      const confirmedAgreementsCount = currentAgreements.filter(a => a.providerId === providerId && a.status === 'confirmed').length;
      const agreementBonus = confirmedAgreementsCount * 0.1;
      
      const totalScore = totalRatingFromReviews + agreementBonus;
      const totalItemsForAverage = providerReviews.length;

      let newRating = 0;
      if (totalItemsForAverage > 0) {
        newRating = Math.min(5, parseFloat((totalScore / totalItemsForAverage).toFixed(2)));
      } else if (agreementBonus > 0) {
        newRating = Math.min(5, parseFloat((agreementBonus * 2.5).toFixed(2))); // Give a more substantial boost if only agreements exist
      }

      allProviders[providerIndex].rating = newRating;
      allProviders[providerIndex].reviewsCount = providerReviews.length;
      
      saveProviders(allProviders);
      setProviders(allProviders);
  };
  
  const addReview = (review: Review) => {
      const currentReviews = getReviews();
      const newReviews = [...currentReviews, review];
      saveReviews(newReviews);
      setReviews(newReviews);
      recalculateProviderRating(review.providerId, agreements);
      window.dispatchEvent(new Event('storage'));
  };

  const value = {
    isLoggedIn: !!user,
    user,
    providers,
    reviews,
    agreements,
    inboxData,
    isLoading,
    login,
    logout,
    updateProviderData,
    updateAgreementStatus,
    addAgreement,
    addReview
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
