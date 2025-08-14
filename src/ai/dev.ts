import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { next } from '@genkit-ai/next';
import {defineDotprompt, dotprompt} from '@genkit-ai/dotprompt';
import { runSetup } from './flows/setup-flow';

export default genkit({
  plugins: [
    firebase(),
    googleAI(),
    next({
        // The Next.js development server is running on port 9002.
        // Make sure to match this to the port in package.json
        port: 9002,
    }),
    dotprompt(),
  ],
  flowStateStore: 'firebase',
  traceStore: 'firebase',
  enableTracingAndMetrics: true,
  logLevel: 'debug',
  telemetry: {
    instrumentation: {
      // Required to use metrics in the Firebase dashboard
      service: {name: 'honarbanoo-app'},
    },
  },
});

// Run data setup on dev server startup
runSetup().catch(console.error);
