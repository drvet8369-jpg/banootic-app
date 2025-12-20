// Deno Standard Library for serving HTTP.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// THIS IS A TEMPORARY DEBUGGING FUNCTION.
// It captures the incoming request from the Supabase hook and returns it
// as an error message, so we can see the exact payload structure on the client-side.
serve(async (req: Request) => {
  // Immediately handle pre-flight OPTIONS requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const requestBody = await req.json();
    const bodyString = JSON.stringify(requestBody, null, 2); // Pretty-print JSON

    // Intentionally throw an error containing the request body.
    // This will be sent back to the Supabase server and then to our client.
    throw new Error(
      'DEBUG PAYLOAD: \n' + bodyString
    );

  } catch (err) {
    // If reading the body fails, or for our intentional throw,
    // return the error message in a 500 response.
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500, // Return 500 to ensure Supabase forwards the error.
    });
  }
});
