// This file is the SINGLE SOURCE OF TRUTH for all localStorage operations.
// No other file should directly access localStorage for app data.

import type { Provider, Review, Agreement } from './types';
import type { User } from '@/context/AuthContext';
import { defaultProviders, defaultReviews, defaultAgreements } from './data';

// --- Generic LocalStorage Handler ---
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
    // If no data, initialize with default and return it
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Failed to get/parse ${key} from localStorage.`, error);
    return defaultValue;
  }
}

function saveStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage.`, error);
  }
}

// --- Storage Keys ---
const PROVIDERS_KEY = 'banootik-providers';
const REVIEWS_KEY = 'banootik-reviews';
const AGREEMENTS_KEY = 'banootik-agreements';
const USERS_KEY = 'banootik-users';
const CHATS_KEY_PREFIX = 'banootik_chat_';
const INBOX_KEY = 'banootik_inbox_chats';
const CLEANUP_FLAG_KEY = 'banootik-cleanup-v1-final';

// --- Providers ---
export const getProviders = (): Provider[] => getStoredData<Provider[]>(PROVIDERS_KEY, defaultProviders);
export const saveProviders = (data: Provider[]): void => saveStoredData<Provider[]>(PROVIDERS_KEY, data);

// --- Reviews ---
export const getReviews = (): Review[] => getStoredData<Review[]>(REVIEWS_KEY, defaultReviews);
export const saveReviews = (data: Review[]): void => saveStoredData<Review[]>(REVIEWS_KEY, data);

// --- Agreements ---
export const getAgreements = (): Agreement[] => getStoredData<Agreement[]>(AGREEMENTS_KEY, defaultAgreements);
export const saveAgreements = (data: Agreement[]): void => saveStoredData<Agreement[]>(AGREEMENTS_KEY, data);


// --- Users ---
// This function is now smarter. It checks for an existing user list.
// If none exists, it creates one from the default providers.
// This prevents overwriting the user list on subsequent page loads.
export const getAllUsers = (): User[] => {
    if (typeof window === 'undefined') {
        // Fallback for SSR
        return defaultProviders.map(p => ({
            name: p.name,
            phone: p.phone,
            accountType: 'provider'
        }));
    }
    
    try {
        const storedUsers = localStorage.getItem(USERS_KEY);
        if (storedUsers) {
            // A list of users already exists, return it.
            return JSON.parse(storedUsers);
        } else {
            // This is the very first run on a new browser.
            // Create the initial user list from the default providers.
            console.log("Initializing user list for the first time.");
            const initialUsers: User[] = defaultProviders.map(p => ({
                name: p.name,
                phone: p.phone,
                accountType: 'provider' as 'provider'
            }));
            localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
            return initialUsers;
        }
    } catch (error) {
        console.error(`Failed to get/parse ${USERS_KEY} from localStorage.`, error);
        // Fallback in case of parsing error
        return defaultProviders.map(p => ({
            name: p.name,
            phone: p.phone,
            accountType: 'provider'
        }));
    }
};

export const saveAllUsers = (data: User[]): void => saveStoredData<User[]>(USERS_KEY, data);


// --- Chat & Inbox ---
export const getChatMessages = (chatId: string): any[] => getStoredData<any[]>(`${CHATS_KEY_PREFIX}${chatId}`, []);
export const saveChatMessages = (chatId: string, messages: any[]): void => saveStoredData<any[]>(`${CHATS_KEY_PREFIX}${chatId}`, messages);

export const getInboxData = (): Record<string, any> => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(INBOX_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
}

export const saveInboxData = (data: Record<string, any>): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(INBOX_KEY, JSON.stringify(data));
    } catch(e) { console.error("Failed to save inbox data", e); }
}


// One-time data cleanup for development purposes
const runCleanup = () => {
    if (typeof window !== 'undefined') {
        if (!localStorage.getItem(CLEANUP_FLAG_KEY)) {
            console.log("Performing one-time cleanup of incorrect user entry.");
            try {
                const allUsers = getAllUsers();
                const incorrectUserPhone = '09353456789';
                const updatedUsers = allUsers.filter(user => !(user.phone === incorrectUserPhone && user.accountType === 'customer'));
                saveAllUsers(updatedUsers);
                localStorage.setItem(CLEANUP_FLAG_KEY, 'true');
                console.log("Cleanup successful.");
            } catch (e) {
                console.error("Cleanup failed:", e);
            }
        }
    }
}
runCleanup();
