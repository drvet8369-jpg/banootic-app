// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// This is the main handler for the Supabase Edge Function.
console.log('Kavenegar OTP Sender function initialized.');

// Define CORS headers to allow requests from any origin.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // First, handle pre-flight CORS requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Retrieve the Kavenegar API key from the environment variables.
    const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
    if (!KAVENEGAR_API_KEY) {
      throw new Error('KAVENEGAR_API_KEY is not set in Edge Function secrets.');
    }

    // Parse the JSON payload sent by the Supabase Auth hook.
    const { record } = await req.json();

    // Extract the user's phone number and the OTP from the payload.
    const phone = record?.phone;
    const otp = record?.confirmation_token;

    // Check if both phone and OTP are present.
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: 'Phone number or OTP not found in the request payload.' }),
        {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Construct the URL for the Kavenegar Verify Lookup API.
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${phone}&token=${otp}&template=banootik-otp`;

    // Make the API call to Kavenegar.
    await fetch(url);

    // Return a success response (empty JSON object).
    return new Response(JSON.stringify({}), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Log the error for debugging and return a 500 status.
    console.error('Error in Kavenegar OTP Sender:', err.message);
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${err.message}` }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
