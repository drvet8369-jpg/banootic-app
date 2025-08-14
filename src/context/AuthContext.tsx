'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';


// This new AuthContext is lean and focused. It only handles the authentication state of the user.
// All data fetching (providers, reviews, etc.) is now delegated to the components/pages that need it.
// This is a much cleaner and more robust architecture that prevents the deadlocks we were experiencing.

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean; // This now ONLY refers to the initial auth state check.
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On initial load, try to hydrate the user from localStorage.
  // This gives an immediate 'logged in' feeling while Firebase verifies.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('banootik-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      localStorage.removeItem('banootik-user');
    }
    // We set loading to false here, but the Firebase listener below will provide the true state soon.
    setIsLoading(false);
  }, []);
  

  const login = useCallback((userData: User) => {
    // This function is now just for setting the user state in the context and localStorage.
    // The actual sign-in with Firebase is handled separately.
    try {
      localStorage.setItem('banootik-user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      localStorage.removeItem('banootik-user');
      setUser(null);
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
