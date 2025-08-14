import 'dotenv/config'; // Make sure this is at the very top
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { next } from '@genkit-ai/next';
import { runSetup } from './flows/setup-flow';

export default genkit({
  plugins: [
    firebase(),
    googleAI({}),
    next({
      port: 9002,
    }),
  ],
  flowStateStore: 'firebase',
  traceStore: 'firebase',
  enableTracingAndMetrics: true,
  logLevel: 'debug',
  telemetry: {
    instrumentation: {
      service: { name: 'zanmahal-app' },
    },
  },
});

// Run data setup on dev server startup
runSetup().catch(console.error);
