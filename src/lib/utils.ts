import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a Persian phone number to the international format required by Supabase.
 * e.g., "09123456789" becomes "+989123456789"
 * @param phone The phone number to normalize.
 * @returns The normalized phone number.
 */
export function normalizePhoneNumber(phone: string): string {
    if (phone.startsWith('+98')) {
        return phone;
    }
    if (phone.startsWith('09')) {
        return `+98${phone.substring(1)}`;
    }
    // If the format is unknown, return it as is, Supabase will handle the error.
    return phone;
}
