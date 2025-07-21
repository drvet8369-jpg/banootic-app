import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import firebase from '@genkit-ai/firebase';
import 'dotenv/config';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logSinks: ['firebase'],
  flowStateStore: 'firebase',
  traceStore: 'firebase',
});
