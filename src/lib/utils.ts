import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number to the local Iranian format (09...).
 * This is the primary internal format for services like Kavenegar.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "09..." format.
 * @throws {Error} if the phone number is invalid.
 */
export function normalizeForKavenegar(phone: string): string {
  if (!phone) {
    throw new Error("شماره تلفن نمی‌تواند خالی باشد.");
  }

  // Convert to string, trim whitespace
  let normalized = phone.toString().trim();

  // Remove all non-digit characters except for a leading '+'
  normalized = normalized.replace(/[^0-9+]/g, '');

  if (normalized.startsWith('+98')) {
    // Convert +989... to 09...
    return '0' + normalized.slice(3);
  }
  
  if (normalized.startsWith('98')) {
    // Convert 989... to 09...
    return '0' + normalized.slice(2);
  }

  if (normalized.startsWith('9') && normalized.length === 10) {
    // Convert 9... to 09...
    return '0' + normalized;
  }
  
  // Check if it's already a valid format
  if (/^09\d{9}$/.test(normalized)) {
    return normalized;
  }

  throw new Error("فرمت شماره تلفن موبایل وارد شده معتبر نیست.");
}

/**
 * Normalizes a phone number to the international E.164 format for Supabase Auth.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the phone number is invalid.
 */
export function normalizeForSupabaseAuth(phone: string): string {
  // First, normalize to the standard local format
  const localFormat = normalizeForKavenegar(phone);
  
  // Then, convert "09..." to "+989..."
  return '+98' + localFormat.slice(1);
}
