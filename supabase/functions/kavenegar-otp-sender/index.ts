import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A "Crash-Proof" Black Box Recorder for debugging Supabase Hooks.
// This function is designed to NEVER return a 500 error. Instead, it captures
// everything it can about the incoming request and returns it in a successful (200) response.
serve(async (req: Request) => {
  const requestData = {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    body: 'Could not read body', // Default message
    error: 'No error caught',   // Default message
  };

  try {
    // Attempt to read the body as raw text. This is safer than req.json()
    // because it won't crash if the body is empty or not valid JSON.
    const rawBody = await req.text();
    requestData.body = rawBody || 'Body was empty or unreadable';

  } catch (err) {
    // If even reading the raw text fails, log the error.
    console.error('Failed to read request body as text:', err);
    requestData.error = `Failed to read body: ${err.message}`;
  }

  // Always return a 200 OK response, with the captured data as the payload.
  // This prevents the "500 from hook" error and allows us to see the data
  // in the client-side toast notification.
  return new Response(JSON.stringify(requestData, null, 2), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 200,
  });
});
