
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
        const chatDocSnap = await chatDocRef.get();
        
        // If chat doesn't exist, create it with the members
        if (!chatDocSnap.exists) {
            await chatDocRef.set({
                members: [senderId, receiverId],
                lastMessage: text,
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            // If chat exists, just update the last message and timestamp
             await chatDocRef.update({
                lastMessage: text,
                updatedAt: FieldValue.serverTimestamp(),
            });
        }
        
        // Reference to the messages subcollection
        const messagesColRef = chatDocRef.collection('messages');
        
        // Add the new message document
        await messagesColRef.add({
            text,
            senderId,
            receiverId,
            createdAt: FieldValue.serverTimestamp(),
        });
      
      return { success: true };
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return { success: false, error: `Failed to send message: ${errorMessage}` };
    }
  }
);
