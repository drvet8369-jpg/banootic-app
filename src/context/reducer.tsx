import { getProviders, saveProviders, getReviews, saveReviews, getInboxData, saveInboxData, getChatMessages, saveChatMessages, getAgreements, saveAgreements } from '@/lib/data';
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
  | UpdateAgreementStatusAction;


// 4. Create the Reducer Function
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE_STATE': {
      const providers = getProviders();
      const reviews = getReviews();
      const inboxData = getInboxData();
      const agreements = getAgreements();
      const storedUserJSON = localStorage.getItem('honarbanoo-user');
      let user: User | null = null;
      
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          const isProvider = providers.some(p => p.phone === storedUser.phone);
          user = { ...storedUser, accountType: isProvider ? 'provider' : 'customer' };
        } catch(e) {
            console.error("Failed to parse user, clearing.", e);
            localStorage.removeItem('honarbanoo-user');
        }
      }

      return {
        ...state,
        user,
        isLoggedIn: !!user,
        providers,
        reviews,
        inboxData,
        agreements,
        isLoading: false,
      };
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
        
        // Also update the provider's rating
        const providerIndex = state.providers.findIndex(p => p.id === action.payload.providerId);
        if (providerIndex > -1) {
            const newProviders = [...state.providers];
            const providerReviews = newReviews.filter(r => r.providerId === action.payload.providerId);
            const totalRating = providerReviews.reduce((acc, r) => acc + r.rating, 0);
            newProviders[providerIndex].reviewsCount = providerReviews.length;
            newProviders[providerIndex].rating = parseFloat((totalRating / newProviders[providerIndex].reviewsCount).toFixed(1));
            saveProviders(newProviders);
            return { ...state, reviews: newReviews, providers: newProviders };
        }
        return { ...state, reviews: newReviews };
    }
    
    case 'ADD_MESSAGE': {
        const { chatId, message, receiverPhone, receiverName, currentUser } = action.payload;
        
        // Update messages for the specific chat
        const currentMessages = getChatMessages(chatId);
        const newMessages = [...currentMessages, message];
        saveChatMessages(chatId, newMessages);
        
        // Update inbox data
        const newInboxData = { ...state.inboxData };
        const currentChat = newInboxData[chatId] || {
            id: chatId,
            members: [currentUser.phone, receiverPhone],
            participants: {
                [currentUser.phone]: { name: currentUser.name, unreadCount: 0 },
                [receiverPhone]: { name: receiverName, unreadCount: 0 }
            }
        };

        currentChat.lastMessage = message.text;
        currentChat.updatedAt = new Date().toISOString();
        if(currentChat.participants[receiverPhone]) {
            currentChat.participants[receiverPhone].unreadCount = (currentChat.participants[receiverPhone].unreadCount || 0) + 1;
        } else {
            currentChat.participants[receiverPhone] = { name: receiverName, unreadCount: 1 };
        }
        
        if (!currentChat.participants[currentUser.phone]) {
            currentChat.participants[currentUser.phone] = { name: currentUser.name, unreadCount: 0 };
        }

        newInboxData[chatId] = currentChat;
        saveInboxData(newInboxData);
        
        return { ...state, inboxData: newInboxData };
    }
    
    case 'UPDATE_MESSAGE': {
        const { chatId, messageId, newText } = action.payload;
        const chatMessages = getChatMessages(chatId);
        const updatedMessages = chatMessages.map(msg => msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg);
        saveChatMessages(chatId, updatedMessages);
        
        const newInboxData = { ...state.inboxData };
        if (newInboxData[chatId]) {
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage?.id === messageId) {
                newInboxData[chatId].lastMessage = newText;
                saveInboxData(newInboxData);
                return { ...state, inboxData: newInboxData };
            }
        }
        return state;
    }
    
    case 'MARK_CHAT_AS_READ': {
        const { chatId, userPhone } = action.payload;
        const newInboxData = { ...state.inboxData };
        if (newInboxData[chatId]?.participants?.[userPhone]?.unreadCount > 0) {
            newInboxData[chatId].participants[userPhone].unreadCount = 0;
            saveInboxData(newInboxData);
            return { ...state, inboxData: newInboxData };
        }
        return state;
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
        const newAgreements = state.agreements.map(a => a.id === agreementId ? { ...a, status } : a);
        saveAgreements(newAgreements);
        return { ...state, agreements: newAgreements };
    }

    default:
      return state;
  }
}
