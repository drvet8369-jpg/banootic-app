
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { firebase as firebasePlugin } from '@genkit-ai/firebase/plugin';
import 'dotenv/config';

export const ai = genkit({
  plugins: [
    firebasePlugin(),
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logSinks: ['firebase'],
  flowStateStore: 'firebase',
  traceStore: 'firebase',
});
