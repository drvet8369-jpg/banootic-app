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
