'use server';

import { generateBiography } from '@/ai/flows/biography-writer-flow';

interface GenerateBioPayload {
    providerName: string;
    serviceType: string;
}

export async function generateBioAction(payload: GenerateBioPayload): Promise<{ biography: string | null; error: string | null; }> {
    if (!process.env.GEMINI_API_KEY) {
        return { biography: null, error: "The AI feature is not configured on the server. GEMINI_API_KEY is missing." };
    }

    try {
        const result = await generateBiography(payload);
        return { biography: result.biography, error: null };
    } catch (e: any) {
        console.error("Error in generateBioAction:", e);
        return { biography: null, error: e.message || "An unknown error occurred while generating the biography." };
    }
}
