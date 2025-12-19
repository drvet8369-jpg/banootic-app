import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number from various Iranian formats to the "09..." standard internal format.
 * It handles Persian/Arabic numerals and different prefixes.
 * @param phone The phone number to normalize.
 * @returns The normalized phone number in "09..." format.
 * @throws {Error} if the number is not a valid Iranian mobile format after cleaning.
 */
export function normalizeIranPhone(phone: string): string {
    if (!phone) {
        throw new Error('شماره تلفن نمی‌تواند خالی باشد.');
    }

    // Convert Persian/Arabic numerals to English
    const persianNumerals = "۰۱۲۳۴۵۶۷۸۹";
    const arabicNumerals = "٠١٢٣٤٥٦٧٨٩";
    let englishPhone = "";
    for (const char of phone) {
        let pIndex = persianNumerals.indexOf(char);
        if (pIndex !== -1) {
            englishPhone += pIndex;
            continue;
        }
        let aIndex = arabicNumerals.indexOf(char);
        if (aIndex !== -1) {
            englishPhone += aIndex;
            continue;
        }
        englishPhone += char;
    }

    // Remove any non-digit characters except for a potential leading '+'
    let clean = englishPhone.replace(/[^\d+]/g, '');

    // Normalize based on prefix
    if (clean.startsWith('+98')) {
        clean = '0' + clean.slice(3);
    } else if (clean.startsWith('98')) {
        clean = '0' + clean.slice(2);
    } else if (clean.startsWith('0098')) {
        clean = '0' + clean.slice(4);
    }

    // After normalization, it must be in the format 09...
    if (!/^09\d{9}$/.test(clean)) {
        throw new Error('فرمت شماره تلفن نامعتبر است. لطفاً یک شماره موبایل صحیح ایرانی وارد کنید.');
    }

    return clean;
}

/**
 * Normalizes a phone number to the international E.164 format (+98...) required by Supabase.
 * @param phone The phone number in any common Iranian format.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the number cannot be converted to a valid Iranian format.
 */
export function normalizePhoneNumber(phone: string): string {
  const internalFormat = normalizeIranPhone(phone); // This will throw if invalid
  // Convert the valid "09..." format to "+989..."
  return '+98' + internalFormat.slice(1);
}
