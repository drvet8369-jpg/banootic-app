'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { getAuth, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userToLogin: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchFullUserDetails = useCallback(async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser.uid) return null;

    // Check if user is a provider first. We use their phone number as the doc ID.
    const providerDocRef = doc(db, 'providers', firebaseUser.uid);
    const providerDocSnap = await getDoc(providerDocRef);

    if (providerDocSnap.exists()) {
        const providerData = providerDocSnap.data();
        return {
            id: firebaseUser.uid,
            name: providerData.name,
            phone: providerData.phone,
            accountType: 'provider',
        } as User;
    } else {
        // If not a provider, they must be a customer.
        // We'll construct a default user object for them.
         return {
            id: firebaseUser.uid,
            name: `کاربر ${firebaseUser.uid.slice(-4)}`,
            phone: firebaseUser.uid,
            accountType: 'customer',
        } as User;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        // First, check localStorage for a quick user load
        const storedUserJSON = localStorage.getItem('banootik-user');
        if (storedUserJSON) {
            try {
                setUser(JSON.parse(storedUserJSON));
            } catch { /* ignore */ }
        }
        // Then, fetch full details from Firestore to ensure data is fresh
        const fullUserDetails = await fetchFullUserDetails(firebaseUser);
        if (fullUserDetails) {
            setUser(fullUserDetails);
            localStorage.setItem('banootik-user', JSON.stringify(fullUserDetails));
        } else {
            // This case might happen if a user exists in Auth but not in Firestore.
            // Log them out to be safe.
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('banootik-user');
        }

      } else {
        setUser(null);
        localStorage.removeItem('banootik-user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchFullUserDetails]);


  const login = useCallback((userData: User) => {
    try {
      localStorage.setItem('banootik-user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle setting user to null and clearing localStorage
      router.push('/');
    } catch (error) {
       console.error("Firebase sign out error", error);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, isLoading }}>
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
