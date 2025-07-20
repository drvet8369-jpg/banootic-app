
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
import type { Message as GenkitMessage } from 'genkit';


// Define the structure for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  providerId: z.number().describe("The ID of the service provider."),
  history: z.array(MessageSchema).describe("The history of the conversation so far, where the last message is the user's most recent message."),
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
    let provider: Provider | undefined | null;

    if (input.providerId === 99) {
        // This is a mock provider for testing from the profile page.
        provider = {
            id: 99,
            name: "هنرمند تستی", 
            service: "خدمات تستی",
            bio: "این یک پروفایل تستی برای بررسی دستیار هوشمند است.",
            location: "نامشخص",
            phone: "نامشخص",
            categorySlug: 'beauty',
            serviceSlug: 'makeup',
            rating: 5,
            reviewsCount: 0,
            portfolio: []
        };
    } else {
        provider = providers.find(p => p.id === input.providerId);
    }


    if (!provider) {
      // In a real app, you might throw a more specific error.
      return { reply: "متاسفانه اطلاعات این هنرمند یافت نشد." };
    }

    const prompt = `شما یک دستیار هوش مصنوعی برای "${provider.name}" هستید که خدمات "${provider.service}" را ارائه می‌دهد. شما باید به نمایندگی از ایشان به سوالات مشتریان پاسخ دهید.

    اطلاعات کلیدی در مورد هنرمند:
    - نام: ${provider.name}
    - خدمات اصلی: ${provider.service}
    - بیوگرافی: ${provider.bio}
    - مکان: ${provider.location}
    - شماره تلفن: ${provider.phone} (فقط در صورتی که کاربر مستقیماً درخواست کرد، آن را ارائه دهید و تاکید کنید که برای رزرو نهایی تماس بگیرند).

    وظایف شما:
    1.  اگر تاریخچه گفتگو خالی است، با یک پیام خوشامدگویی دوستانه شروع کن. از کاربر بپرس چگونه می‌توانی در مورد خدمات "${provider.service}" به او کمک کنی.
    2.  پاسخگویی به سوالات متداول در مورد خدمات, قیمت‌ها (اگر می‌دانی), و زمان‌بندی کلی.
    3.  تشویق مشتریان به رزرو وقت یا خرید.
    4.  اگر سوالی خیلی تخصصی بود یا نیاز به هماهنگی دقیق داشت، به کاربر بگو که پیامش را به خانم "${provider.name}" منتقل می‌کنی و ایشان به زودی پاسخ خواهند داد.
    5.  پاسخ‌ها باید به زبان فارسی، دوستانه، محترمانه و حرفه‌ای باشند.
    `;
    
    // The history contains the full conversation, with the last entry being the user's newest message.
    // If history is empty, the system prompt will instruct the model to start the conversation.
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: prompt, // Use prompt instead of system for more stable behavior
      history: input.history,
    });
    
    if (!output || !output.text) {
      return { reply: "متاسفانه دستیار هوشمند در حال حاضر قادر به پاسخگویی نیست. لطفاً بعداً تلاش کنید یا مستقیماً با هنرمند تماس بگیرید." };
    }

    return {
      reply: output.text,
    };
  }
);
