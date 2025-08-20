import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a given phone number to a standard format starting with '09'.
 * It handles numbers with country code (+98), without leading zero, or already correct.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number string.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove any non-digit characters except for a leading '+'
  let cleaned = phone.trim().replace(/[^0-9+]/g, '');

  // Case 1: Starts with +98
  if (cleaned.startsWith('+98')) {
    // Replace +98 with 0
    return '0' + cleaned.substring(3);
  }
  // Case 2: Starts with 9 (missing the leading 0)
  else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '0' + cleaned;
  }
  // Case 3: Already in the correct format or other cases
  else {
    return cleaned;
  }
}
