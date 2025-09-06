import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to normalize Iranian phone numbers to international format for Supabase
export function normalizePhoneNumber(phone: string): string {
  if (phone.startsWith('09')) {
    // Replaces the leading '0' with '+98'
    return `+98${phone.substring(1)}`;
  }
  // If it already seems to be in international format, return it as is
  if (phone.startsWith('+989')) {
    return phone;
  }
  // Return the original string if it doesn't match the expected formats
  return phone;
}
