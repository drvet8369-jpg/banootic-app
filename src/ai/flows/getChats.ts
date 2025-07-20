
'use server';

/**
 * @fileOverview A flow to retrieve a user's chat list from Firestore.
 * 
 * - getChats - A function that fetches all chats for a given user.
 * - GetChatsInput - The input type for the getChats function.
 * - GetChatsOutput - The return type for the getChats function.
 */

import { z } from 'genkit';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ai } from '@/ai/genkit';
import { providers } from '@/lib/data';

// Define a simple user cache for demonstration purposes
// In a real app, you would fetch user details from a 'users' collection
const getUserDetails = (phone: string): { name: string } => {
    // Check providers first
    const provider = providers.find(p => p.phone === phone);
    if (provider) {
        return { name: provider.name };
    }
    // In a real app, you would query a 'users' collection.
    // For now, we'll return a mock name for customers.
    return { name: `مشتری ${phone.slice(-4)}` };
};


const GetChatsInputSchema = z.object({
  userId: z.string().describe("The ID (phone number) of the user whose chats are being requested."),
});
export type GetChatsInput = z.infer<typeof GetChatsInputSchema>;


const ChatSchema = z.object({
    id: z.string(),
    otherMemberId: z.string(),
    otherMemberName: z.string(),
    lastMessage: z.string(),
    updatedAt: z.date(),
});

const GetChatsOutputSchema = z.object({
  success: z.boolean(),
  chats: z.array(ChatSchema).optional(),
  error: z.string().optional(),
});
export type GetChatsOutput = z.infer<typeof GetChatsOutputSchema>;


export async function getChats(input: GetChatsInput): Promise<GetChatsOutput> {
    return getChatsFlow(input);
}


const getChatsFlow = ai.defineFlow(
  {
    name: 'getChatsFlow',
    inputSchema: GetChatsInputSchema,
    outputSchema: GetChatsOutputSchema,
  },
  async ({ userId }) => {
    try {
        const chatsQuery = adminDb.collection('chats').where('members', 'array-contains', userId);

        const querySnapshot = await chatsQuery.get();

        if (querySnapshot.empty) {
            return { success: true, chats: [] };
        }
        
        const chats = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const otherMemberId = data.members.find((id: string) => id !== userId);
            const otherMemberDetails = getUserDetails(otherMemberId);

            // Convert Firestore Timestamp to JS Date
            const updatedAt = (data.updatedAt as Timestamp)?.toDate() ?? new Date();
            
            return {
                id: doc.id,
                otherMemberId: otherMemberId,
                otherMemberName: otherMemberDetails.name,
                lastMessage: data.lastMessage || '',
                updatedAt: updatedAt,
            };
        });

        // Sort chats by most recent
        const sortedChats = chats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        return { success: true, chats: sortedChats };

    } catch (error) {
      console.error("Error fetching chats in getChatsFlow:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return { success: false, error: `Failed to fetch chats: ${errorMessage}` };
    }
  }
);
