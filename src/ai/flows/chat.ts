/**
 * @fileOverview A simple chat flow for service providers.
 *
 * - chat - A function that handles the chat interaction.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const ChatInputSchema = z.object({
  providerName: z.string().describe('The name of the service provider.'),
  serviceName: z.string().describe('The name of the service being discussed.'),
  history: z.array(HistoryItemSchema).describe('The chat history so far.'),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  answer: z.string().describe('The AI-generated response to the user.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


const chatPrompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    prompt: `You are a helpful and friendly assistant for a service provider named {{providerName}} on the "HonarBanoo" platform.
You specialize in "{{serviceName}}".
Your goal is to answer user questions politely and encourage them to book a service.
Keep your answers concise, helpful, and in Persian.
Do not make up details about pricing or availability unless the user asks for a hypothetical example.
If the user asks to book an appointment, suggest they call the provider directly to schedule.

Chat History:
{{#each history}}
  **{{role}}**: {{#each content}}{{text}}{{/each}}
{{/each}}

New User Message: {{message}}

Based on this, what is your response?
`,
});


const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await chatPrompt(input);
    return output!;
  }
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}
