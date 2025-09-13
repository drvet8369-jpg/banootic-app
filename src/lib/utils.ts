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

  // Remove any non-digit characters except for a leading '+'
  let normalized = convertedPhone.replace(/[^\d+]/g, '');

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
