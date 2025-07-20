
'use server';

/**
 * @fileOverview A chat flow that uses AI to respond to user messages on behalf of a service provider.
 * 
 * - chat - A function that handles the chat interaction.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { providers } from '@/lib/data';
import type { Provider } from '@/lib/types';


// Define the structure for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  providerId: z.number().describe("The ID of the service provider."),
  history: z.array(MessageSchema).describe("The history of the conversation so far."),
  message: z.string().describe("The latest message from the user."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;


const ChatOutputSchema = z.object({
  reply: z.string().describe("The AI-generated reply to the user's message."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}


const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const provider = providers.find(p => p.id === input.providerId);

    if (!provider) {
      // In a real app, you might throw a more specific error.
      return { reply: "متاسفانه اطلاعات این هنرمند یافت نشد." };
    }

    const systemPrompt = `شما یک دستیار هوش مصنوعی برای "${provider.name}" هستید که خدمات "${provider.service}" را ارائه می‌دهد. شما باید به نمایندگی از ایشان به سوالات مشتریان پاسخ دهید.

    اطلاعات کلیدی در مورد هنرمند:
    - نام: ${provider.name}
    - خدمات اصلی: ${provider.service}
    - بیوگرافی: ${provider.bio}
    - مکان: ${provider.location}
    - شماره تلفن: ${provider.phone} (فقط در صورتی که کاربر مستقیماً درخواست کرد، آن را ارائه دهید و تاکید کنید که برای رزرو نهایی تماس بگیرند).

    وظایف شما:
    1.  پاسخگویی به سوالات متداول در مورد خدمات، قیمت‌ها (اگر می‌دانید)، و زمان‌بندی کلی.
    2.  تشویق مشتریان به رزرو وقت یا خرید.
    3.  اگر سوالی خیلی تخصصی بود یا نیاز به هماهنگی دقیق داشت، به کاربر بگویید که پیامش را به خانم "${provider.name}" منتقل می‌کنید و ایشان به زودی پاسخ خواهند داد.
    4.  پاسخ‌ها باید به زبان فارسی، دوستانه، محترمانه و حرفه‌ای باشند.
    `;

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: systemPrompt,
      history: input.history,
      prompt: input.message,
    });

    return {
      reply: output.text,
    };
  }
);
