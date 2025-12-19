import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Reliably normalizes a phone number to the international E.164 format (+98...).
 * This function is robust and designed to handle various common Iranian formats.
 * It is the single source of truth for phone number normalization before sending to Supabase.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the final number is not a valid 9-digit mobile number after normalization.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error('شماره تلفن نمی‌تواند خالی باشد.');
  }

  // 1. Remove all non-digit characters.
  let digits = phone.replace(/\D/g, '');

  // 2. Handle country code prefixes.
  if (digits.startsWith('98')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0098')) {
    digits = digits.substring(4);
  }
  
  // 3. Handle the leading zero for local format.
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // 4. At this point, we should have the core 10 digits (e.g., 9123456789).
  // We expect the number to start with '9' and be 10 digits long.
  if (digits.length !== 10 || !digits.startsWith('9')) {
    throw new Error('فرمت شماره موبایل وارد شده معتبر نیست. شماره باید با ۹ شروع شده و ۱۰ رقم باشد.');
  }

  // 5. Prepend the international code.
  return `+98${digits}`;
}
