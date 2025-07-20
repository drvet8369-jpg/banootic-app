
'use server';

/**
 * @fileOverview A flow to send a message between users and store it in Firestore.
 * 
 * - sendMessage - A function that handles sending a message.
 * - SendMessageInput - The input type for the sendMessage function.
 */

import { z } from 'genkit';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { ai } from '@/ai/genkit';

const SendMessageInputSchema = z.object({
  chatId: z.string().describe("The unique ID of the chat room."),
  text: z.string().min(1).describe("The content of the message."),
  senderId: z.string().describe("The ID of the user sending the message."),
  receiverId: z.string().describe("The ID of the user receiving the message."),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

export async function sendMessage(input: SendMessageInput): Promise<{ success: boolean; error?: string }> {
    return sendMessageFlow(input);
}


const sendMessageFlow = ai.defineFlow(
  {
    name: 'sendMessageFlow',
    inputSchema: SendMessageInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
        const { chatId, text, senderId, receiverId } = input;
        
        // Reference to the chat document
        const chatDocRef = adminDb.collection('chats').doc(chatId);
        
        // Use a transaction to ensure atomicity
        await adminDb.runTransaction(async (transaction) => {
            const chatDocSnap = await transaction.get(chatDocRef);
            
            // If chat doesn't exist, create it with members and initial message details
            if (!chatDocSnap.exists) {
                transaction.set(chatDocRef, {
                    members: [senderId, receiverId],
                    lastMessage: text,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            } else {
                // If chat exists, just update the last message and timestamp
                 transaction.update(chatDocRef, {
                    lastMessage: text,
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }
            
            // Reference to the messages subcollection and add the new message document
            const newMessageRef = chatDocRef.collection('messages').doc();
            transaction.set(newMessageRef, {
                text,
                senderId,
                receiverId,
                createdAt: FieldValue.serverTimestamp(),
            });
        });
      
      return { success: true };
    } catch (error) {
      console.error("Error sending message in sendMessageFlow:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return { success: false, error: `Failed to send message: ${errorMessage}` };
    }
  }
);
