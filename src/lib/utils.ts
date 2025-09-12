import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a Persian phone number to the standard format (e.g., 09xxxxxxxxx).
 * @param phone The phone number to normalize.
 * @returns The normalized phone number.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove any non-digit characters
  let normalized = phone.replace(/\D/g, '');

  // Convert Persian/Arabic numerals to Western numerals
  normalized = normalized
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  // Handle common prefixes
  if (normalized.startsWith('98')) {
    normalized = '0' + normalized.substring(2);
  } else if (normalized.startsWith('+98')) {
     normalized = '0' + normalized.substring(3);
  }

  // Ensure it starts with '09' and has 11 digits
  if (normalized.length === 10 && !normalized.startsWith('0')) {
      normalized = '0' + normalized;
  }
  
  if (normalized.startsWith('9') && normalized.length === 10) {
    normalized = '0' + normalized;
  }


  return normalized;
}
