import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes an Iranian phone number to the internal 09... format for validation.
 * @param phone The phone number to normalize.
 * @returns The normalized phone number in 09... format.
 */
export function normalizeIranPhone(phone: string): string {
    if (!phone) return '';
    // Convert Persian/Arabic numerals to English
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
    let clean = convertedPhone.replace(/\D/g, '');

    if (clean.startsWith('98')) {
        return '0' + clean.slice(2);
    }
    
    if (clean.length === 10 && clean.startsWith('9')) {
        return '0' + clean;
    }

    return clean;
}


/**
 * Normalizes an Iranian phone number to the international +98 format for Supabase.
 * @param phone The phone number to normalize.
 * @returns The normalized phone number in +98 format.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const internalFormat = normalizeIranPhone(phone); // First, get it to 09... format

  // If it's a valid internal format, convert to E.164
  if (/^09\d{9}$/.test(internalFormat)) {
    return '+98' + internalFormat.slice(1);
  }
  
  // Return the partially cleaned number as a fallback, Supabase will likely reject it
  // which is the desired behavior for invalid numbers.
  return internalFormat;
}
