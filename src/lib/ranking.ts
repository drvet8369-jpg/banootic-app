
import type { Provider } from './types';

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
    const baseScore = (provider.rating * RATING_WEIGHT) * (provider.reviews_count * REVIEWS_WEIGHT);
    
    // Add bonus for each confirmed agreement
    const agreementScore = confirmedAgreementsCount * AGREEMENT_BONUS;

    return baseScore + agreementScore;
};
