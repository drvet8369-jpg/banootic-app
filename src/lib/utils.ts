import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Reliably normalizes a phone number to the international E.164 format (+98...).
 * It handles various common Iranian formats and throws an error if the format is invalid.
 * This is the single source of truth for phone number normalization before sending to Supabase.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the number cannot be converted to a valid Iranian mobile format.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error('شماره تلفن نمی‌تواند خالی باشد.');
  }

  // First, remove all non-digit characters to get a clean string of numbers.
  const digitsOnly = phone.replace(/\D/g, '');

  // Case 1: Starts with '09' and is 11 digits long (e.g., "09123456789")
  if (digitsOnly.startsWith('09') && digitsOnly.length === 11) {
    // Remove the leading '0' and prepend '+98'
    return `+98${digitsOnly.substring(1)}`;
  }

  // Case 2: Starts with '9' and is 10 digits long (e.g., "9123456789")
  if (digitsOnly.startsWith('9') && digitsOnly.length === 10) {
    // Prepend '+98'
    return `+98${digitsOnly}`;
  }

  // Case 3: Starts with '989' and is 12 digits long (e.g., "989123456789")
  if (digitsOnly.startsWith('989') && digitsOnly.length === 12) {
    // Prepend '+'
    return `+${digitsOnly}`;
  }
  
  // Case 4: Already in the correct E.164 format
  if (digitsOnly.startsWith('989') && phone.startsWith('+') && digitsOnly.length === 12) {
      return phone;
  }

  // If none of the above rules match, the format is invalid.
  throw new Error('فرمت شماره موبایل وارد شده معتبر نیست. لطفاً در قالب 09123456789 وارد کنید.');
}
