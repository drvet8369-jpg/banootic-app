import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Reliably normalizes a phone number to the international E.164 format (+98...).
 * It handles various common Iranian formats.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the number cannot be converted to a valid Iranian mobile format.
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) {
        throw new Error('شماره تلفن نمی‌تواند خالی باشد.');
    }

    // Convert Persian/Arabic numerals to English numerals and remove all non-digit characters.
    const digitsOnly = phone
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
        .replace(/\D/g, '');

    // Case 1: Starts with '09' (e.g., "09123456789") -> Convert to "+989..."
    if (digitsOnly.startsWith('09') && digitsOnly.length === 11) {
        return `+98${digitsOnly.substring(1)}`;
    }
    
    // Case 2: Starts with '989' (e.g., "989123456789") -> Convert to "+989..."
    if (digitsOnly.startsWith('989') && digitsOnly.length === 12) {
        return `+${digitsOnly}`;
    }

    // Case 3: Starts with '9' (e.g., "9123456789") -> Convert to "+989..."
    if (digitsOnly.startsWith('9') && digitsOnly.length === 10) {
        return `+98${digitsOnly}`;
    }

    // If none of the above rules match, the format is invalid.
    throw new Error('فرمت شماره موبایل وارد شده معتبر نیست.');
}
