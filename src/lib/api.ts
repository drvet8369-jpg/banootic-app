// THIS FILE IS CURRENTLY NOT IN USE.
// All data is being managed by `src/lib/data.ts` using localStorage.
// This file can be used in the future if a backend database is integrated.

// 'use server';

import type { Provider, Review, Agreement, PortfolioItem } from './types';
import type { User } from '@/context/AuthContext';
import { normalizePhoneNumber } from './utils';
// import { createClient } from '@supabase/supabase-js';

// Placeholder functions to avoid breaking imports if this file is referenced.
// In a real scenario, these would interact with a database.

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  console.warn("API function 'getProviderByPhone' is a placeholder and does not fetch from a database.");
  return null;
}

export async function getAllProviders(): Promise<Provider[]> {
  console.warn("API function 'getAllProviders' is a placeholder and does not fetch from a database.");
  return [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
  console.warn("API function 'getProvidersByServiceSlug' is a placeholder and does not fetch from a database.");
  return [];
}

export async function getReviewsByProviderId(providerId: string): Promise<Review[]> {
  console.warn("API function 'getReviewsByProviderId' is a placeholder and does not fetch from a database.");
  return [];
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
  console.warn("API function 'addReview' is a placeholder and does not write to a database.");
  // Return a mock response
  return { ...reviewData, id: Date.now(), created_at: new Date().toISOString() };
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string; }): Promise<Provider> {
  console.warn("API function 'updateProviderDetails' is a placeholder and does not write to a database.");
  throw new Error("API function not implemented.");
}

export async function addPortfolioItem(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
   console.warn("API function 'addPortfolioItem' is a placeholder and does not write to a database.");
   throw new Error("API function not implemented.");
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
   console.warn("API function 'deletePortfolioItem' is a placeholder and does not write to a database.");
   throw new Error("API function not implemented.");
}

export async function updateProviderProfileImage(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
  console.warn("API function 'updateProviderProfileImage' is a placeholder and does not write to a database.");
  throw new Error("API function not implemented.");
}

export async getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    console.warn("API function 'getAgreementsByProvider' is a placeholder and does not fetch from a database.");
    return [];
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    console.warn("API function 'confirmAgreement' is a placeholder and does not write to a database.");
    throw new Error("API function not implemented.");
}
