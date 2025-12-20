import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// This is a temporary debug function.
// It captures all incoming request headers and returns them as an error.
// This allows us to see the exact payload structure sent by the Supabase Hook in the UI.

serve(async (req: Request) => {
  try {
    const headersObject: { [key: string]: string } = {};
    for (const [key, value] of req.headers.entries()) {
      headersObject[key] = value;
    }

    // Stringify the headers object to be returned in the error message.
    const headersString = JSON.stringify(headersObject, null, 2);

    // Return a 500 error intentionally to send the debug information back to the client.
    // The message is "Headers received" plus the stringified headers.
    return new Response(
      JSON.stringify({
        error: "DEBUG_MODE: Headers received by Edge Function",
        headers: headersString,
      }),
      {
        status: 500, // Important: We force a 500 to see the output in the client's error handler.
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    // Fallback error
    return new Response(JSON.stringify({ error: `Critical error inside the logger: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
