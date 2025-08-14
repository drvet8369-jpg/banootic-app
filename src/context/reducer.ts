
import { getProviders, saveProviders, getReviews, saveReviews, getInboxData, saveInboxData, getChatMessages, saveChatMessage, getAgreements, saveAgreements } from '@/lib/data';
import type { Provider, Review, Message, User, Agreement } from '@/lib/types';

// 1. Define State Shape
export interface AppState {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: User | null;
  providers: Provider[];
  reviews: Review[];
  inboxData: Record<string, any>;
  agreements: Agreement[];
}

// 2. Define Initial State
export const initialState: AppState = {
  isLoading: true,
  isLoggedIn: false,
  user: null,
  providers: [],
  reviews: [],
  inboxData: {},
  agreements: [],
};

// 3. Define Actions
type InitializeStateAction = { type: 'INITIALIZE_STATE'; isBroadcast?: boolean; };
type LoginAction = { type: 'LOGIN'; payload: User; isBroadcast?: boolean; };
type LogoutAction = { type: 'LOGOUT'; isBroadcast?: boolean; };
type AddProviderAction = { type: 'ADD_PROVIDER'; payload: Provider; isBroadcast?: boolean; };
type UpdateProviderAction = { type: 'UPDATE_PROVIDER'; payload: Provider; isBroadcast?: boolean; };
type AddReviewAction = { type: 'ADD_REVIEW'; payload: Review; isBroadcast?: boolean; };
type AddMessageAction = { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message; receiverPhone: string, receiverName: string; currentUser: User }; isBroadcast?: boolean; };
type UpdateMessageAction = { type: 'UPDATE_MESSAGE'; payload: { chatId: string; messageId: string; newText: string }; isBroadcast?: boolean; };
type MarkChatAsReadAction = { type: 'MARK_CHAT_AS_READ'; payload: { chatId: string; userPhone: string }; isBroadcast?: boolean; };
type AddAgreementAction = { type: 'ADD_AGREEMENT', payload: { provider: Provider, currentUser: User }, isBroadcast?: boolean; };
type UpdateAgreementStatusAction = { type: 'UPDATE_AGREEMENT_STATUS', payload: { agreementId: string, status: 'confirmed' | 'rejected' }, isBroadcast?: boolean; };
type SetDataAction = { type: 'SET_DATA', payload: { providers: Provider[], reviews: Review[], agreements: Agreement[] }};


export type AppAction =
  | InitializeStateAction
  | LoginAction
  | LogoutAction
  | AddProviderAction
  | UpdateProviderAction
  | AddReviewAction
  | AddMessageAction
  | UpdateMessageAction
  | MarkChatAsReadAction
  | AddAgreementAction
  | UpdateAgreementStatusAction
  | SetDataAction;


// 4. Create the Reducer Function
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE_STATE': {
      const storedUserJSON = localStorage.getItem('honarbanoo-user');
      let user: User | null = null;
      
      if (storedUserJSON) {
        try {
          user = JSON.parse(storedUserJSON);
        } catch(e) {
            console.error("Failed to parse user, clearing.", e);
            localStorage.removeItem('honarbanoo-user');
        }
      }

      return {
        ...state,
        user,
        isLoggedIn: !!user,
      };
    }
    
    case 'SET_DATA': {
       return {
         ...state,
         providers: action.payload.providers,
         reviews: action.payload.reviews,
         agreements: action.payload.agreements,
         isLoading: false,
       }
    }

    case 'LOGIN': {
      localStorage.setItem('honarbanoo-user', JSON.stringify(action.payload));
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload,
      };
    }

    case 'LOGOUT': {
      localStorage.removeItem('honarbanoo-user');
      return {
        ...state,
        isLoggedIn: false,
        user: null,
      };
    }
    
    case 'ADD_PROVIDER': {
        const newProviders = [...state.providers, action.payload];
        saveProviders(newProviders);
        return {
            ...state,
            providers: newProviders
        };
    }

    case 'UPDATE_PROVIDER': {
        const newProviders = state.providers.map(p => p.id === action.payload.id ? action.payload : p);
        saveProviders(newProviders);
        let updatedUser = state.user;
        if(state.user && state.user.phone === action.payload.phone) {
           updatedUser = { ...state.user, name: action.payload.name };
           localStorage.setItem('honarbanoo-user', JSON.stringify(updatedUser));
        }
        return {
            ...state,
            user: updatedUser,
            providers: newProviders
        };
    }
    
    case 'ADD_REVIEW': {
        const newReviews = [...state.reviews, action.payload];
        saveReviews(newReviews);
        
        const providerIndex = state.providers.findIndex(p => p.id === action.payload.providerId);
        if (providerIndex > -1) {
            const newProviders = [...state.providers];
            const providerToUpdate = { ...newProviders[providerIndex] };
            
            const providerReviews = newReviews.filter(r => r.providerId === action.payload.providerId);
            const totalRating = providerReviews.reduce((acc, r) => acc + r.rating, 0);
            
            providerToUpdate.reviewsCount = providerReviews.length;
            providerToUpdate.rating = providerReviews.length > 0 ? parseFloat((totalRating / providerReviews.length).toFixed(1)) : 0;
            
            newProviders[providerIndex] = providerToUpdate;
            saveProviders(newProviders);
            return { ...state, reviews: newReviews, providers: newProviders };
        }
        return { ...state, reviews: newReviews };
    }

    case 'ADD_AGREEMENT': {
        const { provider, currentUser } = action.payload;
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
        const newAgreements = [...state.agreements, newAgreement];
        saveAgreements(newAgreements);
        return { ...state, agreements: newAgreements };
    }

    case 'UPDATE_AGREEMENT_STATUS': {
        const { agreementId, status } = action.payload;
        const updatedAgreements = state.agreements.map(a => a.id === agreementId ? { ...a, status } : a);
        saveAgreements(updatedAgreements);
        
        return { ...state, agreements: updatedAgreements };
    }

    default:
      return state;
  }
}
