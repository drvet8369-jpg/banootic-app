
// This is a temporary debugging function.
// It catches the payload from any request and returns a success message.
// This helps us verify that the function is deployed and callable.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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

    // In a real scenario, you'd log this to your monitoring service.
    // For now, we just acknowledge receipt.
    console.log("Log-catcher received payload:", JSON.stringify(requestBody, null, 2));

    return new Response(JSON.stringify({ success: true, message: "Payload received by log-catcher.", received_body: requestBody }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("Error inside log-catcher:", err.message);
    // Return a 500 error if we can't even parse the request.
    return new Response(JSON.stringify({ error: "Failed to process log-catcher request.", details: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
