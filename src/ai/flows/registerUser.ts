/**
 * @fileOverview User registration flow.
 *
 * - registerUser - A function that handles user registration.
 * - UserRegistrationInput - The input type for the registerUser function.
 * - UserRegistrationOutput - The return type for the registerUser function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const UserRegistrationInputSchema = z.object({
  accountType: z.enum(['customer', 'provider']),
  name: z.string().min(2),
  phone: z.string().regex(/^09\d{9}$/),
  serviceType: z.string().optional(),
  bio: z.string().optional(),
});
export type UserRegistrationInput = z.infer<typeof UserRegistrationInputSchema>;

export const UserRegistrationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  userId: z.string().optional(),
});
export type UserRegistrationOutput = z.infer<typeof UserRegistrationOutputSchema>;

export const registerUserFlow = ai.defineFlow(
  {
    name: 'registerUserFlow',
    inputSchema: UserRegistrationInputSchema,
    outputSchema: UserRegistrationOutputSchema,
  },
  async (input) => {
    console.log('Registering user with input:', input);
    
    // In a real application, you would save the user to a database here.
    // For this prototype, we'll simulate a successful registration.
    const userId = `user_${Math.random().toString(36).substring(2, 9)}`;

    return {
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد!',
      userId,
    };
  }
);

export async function registerUser(input: UserRegistrationInput): Promise<UserRegistrationOutput> {
    return registerUserFlow(input);
}
