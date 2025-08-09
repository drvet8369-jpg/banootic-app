'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { appReducer, initialState, AppAction, AppState } from './reducer';

interface AuthContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const performCleanup = () => {
    if (typeof window !== 'undefined') {
        const cleanupFlag = 'honarbanoo-cleanup-v3';
        if (!localStorage.getItem(cleanupFlag)) {
            console.log("Performing one-time cleanup of old localStorage keys...");
            const keysToRemove = [
                'honarbanoo-providers', 
                'honarbanoo-reviews',
                'honarbanoo-inbox-data',
                'honarbanoo-agreements',
                'honarbanoo-providers-v2',
                'honarbanoo-reviews-v2',
                'honarbanoo-inbox-data-v2',
                'honarbanoo-agreements-v2',
                'honarbanoo-cleanup-v20-final-fix'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            // Also clean up old chat messages if any
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('chat_')) {
                    const parts = key.split('_');
                    if (parts.length > 1 && parts[1].startsWith('09')) {
                         localStorage.removeItem(key);
                    }
                }
            });
            localStorage.setItem(cleanupFlag, 'true');
        }
    }
};

if (typeof window !== 'undefined') {
    performCleanup();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_STATE' });
  }, []);

  // Broadcast state changes to other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'app_state_broadcast' && event.newValue) {
        const action = JSON.parse(event.newValue);
        if (!action.isBroadcast) { // Prevent infinite loops
            dispatch({ ...action, isBroadcast: true });
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const enhancedDispatch = (action: AppAction) => {
    dispatch(action);
    if (!action.isBroadcast) {
      try {
        localStorage.setItem('app_state_broadcast', JSON.stringify({ ...action, isBroadcast: true, timestamp: Date.now() }));
      } catch (e) {
        console.error("Could not broadcast state change:", e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, dispatch: enhancedDispatch }}>
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
