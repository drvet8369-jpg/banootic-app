
// This is a temporary debugging function.
// It catches the payload from the Supabase SMS hook and logs it.
// This helps us understand the exact structure of the data Supabase sends.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

console.log("Log Catcher function initialized.");

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Respond to OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const requestBody = await req.json();

    // --- CRITICAL LOGGING ---
    console.log("--- LOG-CATCHER PAYLOAD START ---");
    console.log("Received Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
    console.log("Received Body:", JSON.stringify(requestBody, null, 2));
    console.log("--- LOG-CATCHER PAYLOAD END ---");

    // We must return a successful (200) response, otherwise Supabase
    // will think the hook failed. We are not sending an SMS here, just logging.
    return new Response(JSON.stringify({ success: true, message: "Payload logged successfully." }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Error inside log-catcher:", err.message);
    // Return a 500 error if we can't even parse the request.
    return new Response(JSON.stringify({ error: "Failed to process log-catcher request." }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
