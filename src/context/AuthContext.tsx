'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { appReducer, initialState, AppAction } from './reducer';
import type { User } from '@/lib/types';


// Define the shape of the context value
interface AuthContextType {
  state: typeof initialState;
  dispatch: React.Dispatch<AppAction>;
  login: (userData: User) => void;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the broadcast channel
const channel = typeof window !== 'undefined' ? new BroadcastChannel('honarbanoo-app-state') : null;

// AuthProvider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    // Initial data load when the app starts
    dispatch({ type: 'INITIALIZE_STATE' });
    
    // Listen for messages from other tabs
    if(channel) {
      channel.onmessage = (event: MessageEvent<AppAction>) => {
        // When a message is received, dispatch the action but mark it as a broadcast
        // to prevent an infinite loop of broadcasting.
        if (event.data) {
          dispatch({ ...event.data, isBroadcast: true });
        }
      };
    }

    return () => {
      channel?.close();
    };
  }, []);

  const enhancedDispatch = (action: AppAction) => {
    dispatch(action);
    // If the action did not originate from a broadcast, send it to other tabs.
    if (!action.isBroadcast && channel) {
      channel.postMessage(action);
    }
  };
  
  const login = useCallback((userData: User) => {
    enhancedDispatch({ type: 'LOGIN', payload: userData });
  }, []);

  const logout = useCallback(() => {
    enhancedDispatch({ type: 'LOGOUT' });
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ state, dispatch: enhancedDispatch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
