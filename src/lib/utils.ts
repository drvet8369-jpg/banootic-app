import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number to the international E.164 format (+98...) required by Supabase.
 * It handles various common Iranian formats.
 * @param phone The phone number string to normalize.
 * @returns The normalized phone number in "+98..." format.
 * @throws {Error} if the number cannot be converted to a valid Iranian mobile format.
 */
export function normalizePhoneNumber(phone: string): string {
    if (!phone) {
        throw new Error('Phone number cannot be empty.');
    }

    // Convert Persian/Arabic numerals to English numerals
    let englishPhone = phone
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // Remove all non-digit characters
    const digitsOnly = englishPhone.replace(/\D/g, '');

    // Check for different valid starting formats
    if (digitsOnly.startsWith('989') && digitsOnly.length === 12) {
        // Format: 989...
        return `+${digitsOnly}`;
    } else if (digitsOnly.startsWith('09') && digitsOnly.length === 11) {
        // Format: 09...
        return `+98${digitsOnly.substring(1)}`;
    } else if (digitsOnly.startsWith('9') && digitsOnly.length === 10) {
        // Format: 9... (e.g., 9123456789)
        return `+98${digitsOnly}`;
    }

    // If none of the above match, the format is invalid.
    throw new Error('Invalid Iranian mobile number format.');
}
