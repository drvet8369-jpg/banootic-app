// This is a simplified "boilerplate" function for debugging.
// It removes all external dependencies and logic to test the core function execution.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Simple boilerplate function initialized for final debugging.');

serve(async (req: Request) => {
  // This is a standard pre-flight request handler for CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    console.log('Hook payload received:', body);

    // Instead of doing anything, just return a success message.
    // This tests if the function can execute without crashing.
    return new Response(
      JSON.stringify({ message: 'Function executed successfully. Body received.', data: body }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err) {
    // If even this simple code fails, the error is fundamental.
    console.error('Critical error in boilerplate function:', err.message);
    return new Response(
        JSON.stringify({ error: `Critical internal error: ${err.message}` }), 
        {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            status: 400, // Return 400 to show a client-side error, not 500
        }
    );
  }
});
