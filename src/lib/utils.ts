import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number to the international E.164 format for Supabase Auth.
 * This is the ONLY format Supabase Auth accepts.
 * It handles common Iranian formats like '09...', '989...', and '+989...'.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the phone number is invalid after cleanup.
 */
export function normalizeForSupabaseAuth(phone: string): string {
  if (!phone) {
    throw new Error("شماره تلفن نمی‌تواند خالی باشد.");
  }

  // Remove all non-digit characters
  let digits = phone.toString().replace(/\D/g, '');

  // Handle numbers that start with country code '98'
  if (digits.startsWith('98')) {
    digits = digits.substring(2);
  }
  
  // Handle numbers that start with '0'
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // After cleaning, the number should be 10 digits starting with '9'
  if (digits.length !== 10 || !digits.startsWith('9')) {
    throw new Error("فرمت شماره تلفن موبایل وارد شده معتبر نیست.");
  }

  return `+98${digits}`;
}


/**
 * Formats a phone number for use in a 'tel:' link, ensuring it has a '+' prefix.
 * This function is safe and does not throw errors.
 * @param phone The phone number string to format.
 * @returns The formatted phone number for a tel link.
 */
export function formatForTelLink(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }
  const cleaned = phone.toString().replace(/\s/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('00')) {
    return `+${cleaned.substring(2)}`;
  }
  // For this app, we assume non-prefixed numbers are Iranian
  if (cleaned.startsWith('09')) {
    return `+98${cleaned.substring(1)}`;
  }
   if (cleaned.startsWith('98')) {
    return `+${cleaned}`;
  }
  // Fallback for numbers like 912...
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
      return `+98${cleaned}`;
  }
  // If we can't parse it, return it as is and let the device try.
  return cleaned;
}
