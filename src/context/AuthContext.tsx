'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithCustomToken, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, Provider } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithPhoneNumber: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleUserAuth = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // User is signed in, get their profile from Firestore
      const providerDocRef = doc(db, "providers", firebaseUser.uid);
      const providerDocSnap = await getDoc(providerDocRef);
      
      let userProfile: User;

      if (providerDocSnap.exists()) {
        const providerData = providerDocSnap.data() as Provider;
        userProfile = {
          id: firebaseUser.uid,
          phone: providerData.phone, // Use plain phone from doc
          name: providerData.name,
          accountType: 'provider',
        };
      } else {
        // Regular customer - their display name was set during registration
        userProfile = {
          id: firebaseUser.uid,
          phone: firebaseUser.phoneNumber ? `0${firebaseUser.phoneNumber.substring(3)}` : 'N/A', // Convert +98 to 09
          name: firebaseUser.displayName || `کاربر`,
          accountType: 'customer',
        };
      }
      setUser(userProfile);

    } else {
      // User is signed out
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUserAuth);
    return () => unsubscribe(); // Unsubscribe on cleanup
  }, [handleUserAuth]);

  const loginWithPhoneNumber = async (phone: string) => {
    setIsLoading(true);
    try {
       const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.message || 'Failed to get custom token');
        }
        const { token } = await response.json();
        await signInWithCustomToken(auth, token);
        // onAuthStateChanged will handle setting the user state and loading state
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
      throw error; // Re-throw to be caught by the calling component for UI feedback
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting user to null
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, loginWithPhoneNumber, logout }}>
      {isLoading ? (
         <div className="flex justify-center items-center h-screen w-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
         </div>
      ) : (
        children
      )}
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
