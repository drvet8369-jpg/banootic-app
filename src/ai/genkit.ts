'use server';

import { genkit, Plugin } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { next } from '@genkit-ai/next';

// This file configures the Genkit AI framework.
// It initializes plugins for Next.js, Firebase, and Google AI (for Gemini models).
// The GEMINI_API_KEY is expected to be in the server environment variables.

const plugins: Plugin<any>[] = [next(), firebase()];

if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
} else {
  console.warn("GEMINI_API_KEY is not set. Google AI features will be unavailable.");
}

export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
