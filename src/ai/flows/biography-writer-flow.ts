'use server';
/**
 * @fileOverview An AI agent for generating professional biographies for service providers.
 *
 * - generateBiography - A function that handles the biography generation process.
 * - BiographyWriterInput - The input type for the generateBiography function.
 * - BiographyWriterOutput - The return type for the generateBiography function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BiographyWriterInputSchema = z.object({
  providerName: z.string().describe('The name of the service provider or their business name.'),
  serviceType: z.string().describe('The type of service the provider offers (e.g., "Nail Services", "Traditional Food").'),
});
export type BiographyWriterInput = z.infer<typeof BiographyWriterInputSchema>;

const BiographyWriterOutputSchema = z.object({
    biography: z.string().describe('The generated biography text.'),
});
export type BiographyWriterOutput = z.infer<typeof BiographyWriterOutputSchema>;

export async function generateBiography(input: BiographyWriterInput): Promise<BiographyWriterOutput> {
  return biographyWriterFlow(input);
}

const prompt = ai.definePrompt({
    name: 'biographyWriterPrompt',
    input: { schema: BiographyWriterInputSchema },
    output: { schema: BiographyWriterOutputSchema },
    prompt: `You are an expert copywriter specializing in creating engaging and professional biographies for local service providers in Iran. Your tone should be warm, trustworthy, and professional.

    Generate a short, appealing biography (2-3 sentences) in Persian for the following provider.

    The provider's name is "{{providerName}}" and they specialize in "{{serviceType}}".

    The biography should highlight their expertise and invite customers. Do not use hashtags or emojis. Be creative and concise.`,
});

const biographyWriterFlow = ai.defineFlow(
    {
        name: 'biographyWriterFlow',
        inputSchema: BiographyWriterInputSchema,
        outputSchema: BiographyWriterOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error('The AI model did not return a valid biography.');
        }
        return output;
    }
);
