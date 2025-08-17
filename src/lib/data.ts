import type { Provider, Agreement } from './types';

// This file is now primarily for localStorage-based data
// like Agreements, which we haven't migrated to Supabase yet.

const AGREEMENTS_STORAGE_KEY = 'banotic-agreements';
const defaultAgreements: Agreement[] = [];

export const getAgreements = (): Agreement[] => {
    if (typeof window === 'undefined') return defaultAgreements;
    try {
        const stored = localStorage.getItem(AGREEMENTS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        } else {
            localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(defaultAgreements));
            return defaultAgreements;
        }
    } catch (e) {
        console.error("Failed to access localStorage for agreements", e);
        return defaultAgreements;
    }
}

export const saveAgreements = (updatedAgreements: Agreement[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(AGREEMENTS_STORAGE_KEY, JSON.stringify(updatedAgreements));
    } catch (e) {
        console.error("Failed to save agreements to localStorage", e);
    }
}

/**
 * Calculates a ladder score for a provider based on rating, reviews, and agreements.
 * @param provider The provider to score.
 * @param confirmedAgreementsCount The number of confirmed agreements for this provider.
 * @returns A numerical score.
 */
export const calculateProviderScore = (provider: Provider, confirmedAgreementsCount: number): number => {
    // Weight constants - can be tuned
    const RATING_WEIGHT = 5;
    const REVIEWS_WEIGHT = 1;
    const AGREEMENT_BONUS = 10; // Bonus points for each confirmed agreement

    // Base score: A provider with 0 reviews but a 5-star rating shouldn't rank high.
    // So we use the number of reviews to give weight to the rating.
    const baseScore = (provider.rating * RATING_WEIGHT) * (provider.reviewsCount * REVIEWS_WEIGHT);
    
    // Add bonus for each confirmed agreement
    const agreementScore = confirmedAgreementsCount * AGREEMENT_BONUS;

    return baseScore + agreementScore;
};
