// This is the final, correct version of the Edge Function.
// It is designed to work with Supabase's standard Auth Hook behavior.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Supabase sends hook data in a nested 'record' object when using JWT verification.
    const body = await req.json();
    
    // IMPORTANT: The phone and token are inside the 'record' object.
    const { phone, otp: token } = body.record;

    // Validate the necessary data.
    if (!phone || !token) {
      throw new Error(`'phone' or 'otp' not found in request body.record. Received: ${JSON.stringify(body)}`);
    }
    if (!KAVENEGAR_API_KEY) {
      throw new Error('KAVENEGAR_API_KEY is not set in function secrets.');
    }

    // Prepare and send the request to the Kavenegar API.
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams({
      receptor: phone,
      token: token,
      template: 'logincode',
    });

    const kavenegarResponse = await fetch(url, {
      method: 'POST',
      body: params,
    });

    const responseData = await kavenegarResponse.json();

    // Check if the Kavenegar API call was successful.
    if (kavenegarResponse.status !== 200 || responseData?.return?.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    // Return a success response to Supabase. An empty object is sufficient.
    return new Response(JSON.stringify({}), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Catch any error and return a detailed error message.
    console.error('Fatal Error in Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500, // Return a 500 error to signal failure to Supabase.
    });
  }
});
