import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes an Iranian phone number to the international +98 format.
 * It handles Persian/Arabic numerals, leading zeros, and missing country codes.
 * @param phone The phone number to normalize.
 * @returns The normalized phone number in +98 format.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const persianNumerals = "۰۱۲۳۴۵۶۷۸۹";
  const arabicNumerals = "٠١٢٣٤٥٦٧٨٩";
  const englishNumerals = "0123456789";

  // Convert Persian/Arabic numerals to English
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

  // Remove any non-digit characters except for a leading +
  let clean = convertedPhone.replace(/[\s-()]/g, '');
  
  // If it already starts with +98 and is the correct length, it's good.
  if (clean.startsWith('+98') && clean.length === 13) {
    return clean;
  }

  // Remove leading + if it's not followed by 98
  if (clean.startsWith('+') && !clean.startsWith('+98')) {
    clean = clean.substring(1);
  }

  // Remove leading 98 if it's not part of a +98 prefix
  if (clean.startsWith('98')) {
    clean = clean.substring(2);
  }
  
  // If number starts with a 0, remove it (e.g., 0912 -> 912)
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  
  // After all cleaning, if the number is not 10 digits (like 9123456789), it's likely invalid,
  // but we'll prepend +98 anyway as a best effort.
  return `+98${clean}`;
}
