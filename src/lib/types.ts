export interface User {
  id: string; // phone number is the ID
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

export interface Category {
  id: number;
  name: string;
  slug: 'beauty' | 'cooking' | 'tailoring' | 'handicrafts';
  description: string;
}

export interface Service {
  name: string;
  slug: string;
  categorySlug: Category['slug'];
}

export interface PortfolioItem {
  src: string;
  aiHint?: string;
}

export interface Provider {
  id: string; // Firestore document ID
  name: string;
  service: string; 
  location: string;
  phone: string; 
  bio: string;
  categorySlug: Category['slug'];
  serviceSlug: Service['slug'];
  rating: number;
  reviewsCount: number;
  agreementsCount: number;
  profileImage: PortfolioItem; 
  portfolio: PortfolioItem[];
}

export interface Review {
  id: string; // Firestore document ID
  providerId: string; // Corresponds to Provider's id
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO String format for client
}

export interface Message {
  id: string;
  text: string;
  senderId: string; // phone number of the sender
  createdAt: string; // ISO string for client
  isEdited?: boolean;
}

export interface Chat {
    id: string; // chat ID
    members: string[]; // array of user phones
    participants: {
        [key: string]: { // key is user phone
            name: string;
        }
    };
    lastMessage: string;
    updatedAt: string; // ISO String
}

export interface InboxChatView extends Chat {
    otherMemberId: string;
    otherMemberName: string;
    unreadCount: number;
}


export interface Agreement {
  id: string; // Firestore document ID
  providerPhone: string;
  customerPhone: string;
  customerName: string;
  status: 'pending' | 'confirmed';
  requestedAt: string; // ISO string
  confirmedAt?: string; // ISO string
}
