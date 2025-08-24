
import type { Provider, Review, Agreement, Customer, PortfolioItem } from './types';
import { createClient } from './supabase/client';

// This is a placeholder for a real user creation logic.
// In a real app, this would involve Supabase Auth.
const FAKE_USER_ID_COUNTER = 'fake_user_id_counter';

function getNextUserId() {
    if (typeof window === 'undefined') return Math.random().toString(36).substring(2);
    let counter = parseInt(localStorage.getItem(FAKE_USER_ID_COUNTER) || '100');
    counter++;
    localStorage.setItem(FAKE_USER_ID_COUNTER, counter.toString());
    return `user_${counter}`;
}


export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const providers = getProviders();
  return providers.find(p => p.phone === phone) || null;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
    // In this local storage version, a customer is just a user who isn't a provider.
    // We'll simulate this by checking if they are NOT in the providers list.
    // A real implementation would query a 'customers' table.
    const providers = getProviders();
    if (providers.some(p => p.phone === phone)) {
        return null; // They are a provider, not just a customer.
    }
    // For now, we don't have a separate customer list, so if they exist, they exist via AuthContext.
    // This function becomes a check: "Is this phone number registered as a provider?"
    // A more robust implementation is needed for a real customer table.
    return null; 
}


export async function createProvider(providerData: Partial<Provider>): Promise<Provider> {
    const allProviders = getProviders();
    const newId = allProviders.length > 0 ? Math.max(...allProviders.map(p => typeof p.id === 'number' ? p.id : 0)) + 1 : 1;
    
    const newProvider: Provider = {
        id: newId,
        user_id: getNextUserId(),
        name: providerData.name || '',
        phone: providerData.phone || '',
        service: providerData.service || '',
        location: providerData.location || 'ارومیه',
        bio: providerData.bio || '',
        category_slug: providerData.category_slug || 'beauty',
        service_slug: providerData.service_slug || 'manicure-pedicure',
        rating: 0,
        reviews_count: 0,
        profile_image: { src: '', ai_hint: 'woman portrait' },
        portfolio: [],
        created_at: new Date().toISOString(),
    };

    saveProviders([...allProviders, newProvider]);
    return newProvider;
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    // In our simplified local storage model, creating a "customer" doesn't
    // require saving them to a separate list. Their existence is managed
    // by the AuthContext. This function mainly provides a consistent API
    // and returns the expected user object.
     const newCustomer: Customer = {
        id: getNextUserId(),
        user_id: getNextUserId(),
        created_at: new Date().toISOString(),
        name: customerData.name || '',
        phone: customerData.phone || ''
    };
    return newCustomer;
}

export async function getAllProviders(): Promise<Provider[]> {
    return getProviders();
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const allProviders = getProviders();
    return allProviders.filter(p => p.service_slug === serviceSlug);
}

export async function getReviewsByProviderId(providerId: number | string): Promise<Review[]> {
    const allReviews = getReviews();
    // Ensure consistent type comparison
    return allReviews.filter(r => r.provider_id.toString() === providerId.toString());
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at' | 'user_id' | 'author_name'> & { author_name: string }): Promise<Review> {
    const allReviews = getReviews();
    const newReview: Review = {
        ...reviewData,
        id: Date.now().toString(),
        user_id: getNextUserId(), // Simulate a user ID
        created_at: new Date().toISOString(),
    };
    const updatedReviews = [...allReviews, newReview];
    saveReviews(updatedReviews);
    await updateProviderRating(reviewData.provider_id);
    return newReview;
}

export async function updateProviderRating(providerId: number | string): Promise<void> {
    const providerReviews = await getReviewsByProviderId(providerId);
    if (providerReviews.length === 0) return;

    const totalRating = providerReviews.reduce((acc, r) => acc + r.rating, 0);
    const newAverageRating = parseFloat((totalRating / providerReviews.length).toFixed(1));
    
    const allProviders = getProviders();
    const providerIndex = allProviders.findIndex(p => p.id.toString() === providerId.toString());

    if (providerIndex > -1) {
        allProviders[providerIndex].rating = newAverageRating;
        allProviders[providerIndex].reviews_count = providerReviews.length;
        saveProviders(allProviders);
    }
}

// Dummy storage implementation
const PROVIDERS_STORAGE_KEY = 'banotik-providers';
const REVIEWS_STORAGE_KEY = 'banotik-reviews';
const AGREEMENTS_STORAGE_KEY = 'banotik-agreements';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading from localStorage key “${key}”:`, e);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error writing to localStorage key “${key}”:`, e);
    }
};

const getProviders = (): Provider[] => getFromStorage<Provider[]>(PROVIDERS_STORAGE_KEY, []);
const saveProviders = (providers: Provider[]) => saveToStorage<Provider[]>(PROVIDERS_STORAGE_KEY, providers);
const getReviews = (): Review[] => getFromStorage<Review[]>(REVIEWS_STORAGE_KEY, []);
const saveReviews = (reviews: Review[]) => saveToStorage<Review[]>(REVIEWS_STORAGE_KEY, reviews);
const getAgreements = (): Agreement[] => getFromStorage<Agreement[]>(AGREEMENTS_STORAGE_KEY, []);
const saveAgreements = (agreements: Agreement[]) => saveToStorage<Agreement[]>(AGREEMENTS_STORAGE_KEY, agreements);


// Agreement Functions
export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    return getAgreements().filter(a => a.provider_phone === providerPhone);
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    return getAgreements().filter(a => a.customer_phone === customerPhone);
}

export async function createAgreement(provider: Provider, user: { phone: string, name: string }): Promise<Agreement> {
    const allAgreements = getAgreements();
    
    const existing = allAgreements.find(a => a.provider_phone === provider.phone && a.customer_phone === user.phone);
    if(existing) {
        throw new Error('شما قبلاً یک درخواست برای این هنرمند ثبت کرده‌اید.');
    }

    const newAgreement: Agreement = {
        id: allAgreements.length > 0 ? Math.max(...allAgreements.map(a => a.id)) + 1 : 1,
        provider_id: provider.id,
        provider_phone: provider.phone,
        customer_phone: user.phone,
        customer_name: user.name,
        status: 'pending',
        requested_at: new Date().toISOString(),
        confirmed_at: null,
    };
    saveAgreements([...allAgreements, newAgreement]);
    return newAgreement;
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const allAgreements = getAgreements();
    const agreementIndex = allAgreements.findIndex(a => a.id === agreementId);

    if (agreementIndex === -1) {
        throw new Error("Agreement not found");
    }
    
    const updatedAgreement = {
        ...allAgreements[agreementIndex],
        status: 'confirmed' as const,
        confirmed_at: new Date().toISOString(),
    };

    allAgreements[agreementIndex] = updatedAgreement;
    saveAgreements(allAgreements);
    return updatedAgreement;
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string }): Promise<Provider> {
    const allProviders = getProviders();
    const providerIndex = allProviders.findIndex(p => p.phone === phone);
    if (providerIndex === -1) throw new Error("Provider not found");

    allProviders[providerIndex] = { ...allProviders[providerIndex], ...details };
    saveProviders(allProviders);
    return allProviders[providerIndex];
}

export async function updateProviderPortfolio(phone: string, portfolio: PortfolioItem[]): Promise<Provider> {
    const allProviders = getProviders();
    const providerIndex = allProviders.findIndex(p => p.phone === phone);
    if (providerIndex === -1) throw new Error("Provider not found");
    
    allProviders[providerIndex].portfolio = portfolio;
    saveProviders(allProviders);
    return allProviders[providerIndex];
}

export async function updateProviderProfileImage(phone: string, profileImage: PortfolioItem): Promise<Provider> {
     const allProviders = getProviders();
    const providerIndex = allProviders.findIndex(p => p.phone === phone);
    if (providerIndex === -1) throw new Error("Provider not found");
    
    allProviders[providerIndex].profile_image = profileImage;
    saveProviders(allProviders);
    return allProviders[providerIndex];
}
