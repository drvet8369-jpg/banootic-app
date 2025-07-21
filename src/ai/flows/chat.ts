
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
  history: z.array(MessageSchema).optional().describe("The history of the conversation so far. If empty or undefined, a welcome message will be generated."),
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
            phone: "09353847484",
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
    1.  **اگر مکالمه تازه شروع شده، با یک پیام خوشامدگویی دوستانه شروع کن.** از کاربر بپرس چگونه می‌توانی در مورد خدمات "${provider.service}" به او کمک کنی.
    2.  پاسخگویی به سوالات متداول در مورد خدمات, قیمت‌ها (اگر می‌دانی), و زمان‌بندی کلی.
    3.  تشویق مشتریان به رزرو وقت یا خرید.
    4.  اگر سوالی خیلی تخصصی بود یا نیاز به هماهنگی دقیق داشت، به کاربر بگو که پیامش را به خانم "${provider.name}" منتقل می‌کنی و ایشان به زودی پاسخ خواهند داد.
    5.  پاسخ‌ها باید به زبان فارسی، دوستانه، محترمانه و حرفه‌ای باشند.
    `;
    
    // Determine the parameters for the generate call based on history
    let generateParams: any;
    const cleanHistory = (input.history || []).filter(h => h.content);

    if (cleanHistory.length === 0) {
        // This is the initial call to start the conversation.
        generateParams = {
            model: 'googleai/gemini-1.5-flash-latest',
            system: systemPrompt,
            prompt: "سلام، لطفا به عنوان دستیار هوشمند، مکالمه را با یک خوشامدگویی شروع کن.",
        };
    } else {
        // This is a follow-up message.
        generateParams = {
            model: 'googleai/gemini-1.5-flash-latest',
            system: systemPrompt,
            history: cleanHistory,
        };
    }
    
    try {
        const { output } = await ai.generate(generateParams);
        
        if (!output || !output.text) {
          return { reply: "متاسفانه دستیار هوشمند در حال حاضر قادر به پاسخگویی نیست. لطفاً بعداً تلاش کنید یا مستقیماً با هنرمند تماس بگیرید." };
        }

        return {
          reply: output.text,
        };
    } catch (e) {
        console.error("AI Generation Error in chatFlow:", e);
        return { reply: "خطا در ارتباط با سرویس هوش مصنوعی. لطفاً مجدداً تلاش کنید." };
    }
  }
);
