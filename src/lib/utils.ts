import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes an Iranian phone number to the international +98 format.
 * @param phone The phone number to normalize.
 * @returns The normalized phone number.
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let normalized = phone.replace(/\D/g, '');

  // If the number starts with 09, replace it with +989
  if (normalized.startsWith('09')) {
    normalized = '+989' + normalized.substring(2);
  }
  // If it starts with 9 (without leading 0), prepend +98
  else if (normalized.startsWith('9')) {
    normalized = '+98' + normalized;
  }
  // If it already starts with 98, prepend +
  else if (normalized.startsWith('98')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}