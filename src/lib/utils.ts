import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes an Iranian phone number to the international +98 format.
 * It also converts Persian/Arabic numerals to English numerals.
 * @param phone The phone number to normalize.
 * @returns The normalized phone number.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const persianNumerals = "۰۱۲۳۴۵۶۷۸۹";
  const arabicNumerals = "٠١٢٣٤٥٦٧٨٩";
  const englishNumerals = "0123456789";

  let convertedPhone = "";
  for (let i = 0; i < phone.length; i++) {
    const char = phone[i];
    let numeralIndex = persianNumerals.indexOf(char);
    if (numeralIndex > -1) {
      convertedPhone += englishNumerals[numeralIndex];
      continue;
    }
    numeralIndex = arabicNumerals.indexOf(char);
    if (numeralIndex > -1) {
      convertedPhone += englishNumerals[numeralIndex];
      continue;
    }
    convertedPhone += char;
  }

  // Remove any non-digit characters
  let normalized = convertedPhone.replace(/\D/g, '');

  // If the number starts with 98, it's likely already in a good format but without the +
  if (normalized.startsWith('98')) {
    return `+${normalized}`;
  }

  // If the number starts with 0, replace it with +98
  if (normalized.startsWith('0')) {
    return `+98${normalized.substring(1)}`;
  }
  
  // If it's a 10-digit number starting with 9 (e.g. 912...), prepend +98
  if (normalized.length === 10 && normalized.startsWith('9')) {
    return `+98${normalized}`;
  }
  
  // Fallback for numbers that might be missing the leading 0 (e.g. 912... instead of 0912...)
  // This might not be hit if the regex in the form validation is strict.
  if (normalized.length > 9 && !normalized.startsWith('+98')) {
      return `+98${normalized}`;
  }

  // If it doesn't match known patterns but looks like a number, return with +98 prefix as a best guess
  if (!normalized.startsWith('+')) {
    return `+98${normalized}`;
  }

  return normalized;
}
