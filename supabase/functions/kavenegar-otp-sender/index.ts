// Deno Standard Library for serving HTTP.
// https://deno.land/std@0.177.0/http/server.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Get the Kavenegar API key from the environment variables.
const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');

// Define CORS headers to allow requests from any origin.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The main server function that handles incoming requests.
serve(async (req: Request) => {
  // Immediately handle pre-flight OPTIONS requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Verify that the Kavenegar API key is set.
    if (!KAVENEGAR_API_KEY) {
      console.error('KAVENEGAR_API_KEY is not set in environment variables.');
      throw new Error('Server configuration error: SMS provider API key is missing.');
    }

    // 2. Safely parse the JSON payload from the Supabase hook.
    // The payload structure is { "phone": "...", "token": "..." }
    const payload = await req.json();
    console.log('Received payload from Supabase hook:', JSON.stringify(payload, null, 2));

    const phone = payload?.phone;
    const token = payload?.token;

    // 3. Validate that the necessary data (phone and token) was received.
    if (!phone || !token) {
      console.error('Invalid payload from Supabase hook. Phone or token is missing.', payload);
      throw new Error('Invalid request: Phone number and token are required.');
    }

    // 4. Prepare and send the request to the Kavenegar API.
    const kavenegarUrl = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    
    // Kavenegar expects the receptor number in the local format (e.g., 09xxxxxxxxx).
    // Supabase sends it in E.164 format (+989...), so we must normalize it.
    const kavenegarReceptor = phone.replace('+98', '0');
    
    params.append('receptor', kavenegarReceptor);
    params.append('token', token);
    params.append('template', 'logincode');

    // 5. Make the API call to Kavenegar.
    const kavenegarResponse = await fetch(kavenegarUrl, {
      method: 'POST',
      body: params,
    });

    const responseData = await kavenegarResponse.json();

    // 6. Check if the Kavenegar API call was successful.
    if (kavenegarResponse.status !== 200 || responseData.return.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    console.log('OTP sent successfully via Kavenegar.');

    // 7. Return a success response to the Supabase hook.
    // An empty JSON object {} is sufficient to signal success.
    return new Response(JSON.stringify({}), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Critical Error in Kavenegar Edge Function:', err.message);
    // Return a 500 Internal Server Error if anything goes wrong.
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
