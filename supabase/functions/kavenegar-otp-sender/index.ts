// This is the final, production-ready version of the Kavenegar OTP sender function.
// It is designed to work securely with Supabase Auth Hooks.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Get the Kavenegar API key from the function's secrets.
// This must be set in your Supabase dashboard under Edge Functions -> kavenegar-otp-sender -> Settings -> Secrets.
const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Kavenegar OTP Sender function initialized.');

serve(async (req: Request) => {
  // This is a standard pre-flight request handler for CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Check if the Kavenegar API key is configured.
    if (!KAVENEGAR_API_KEY) {
      console.error('KAVENEGAR_API_KEY secret is not set.');
      throw new Error('Server configuration error: Missing Kavenegar API key.');
    }

    // When using Auth Hooks, Supabase sends the data inside a 'record' object.
    // This is the correct and final way to access the data.
    const { record } = await req.json();
    console.log('Received hook payload:', JSON.stringify(record, null, 2));

    const phone = record?.phone;
    const token = record?.otp;

    if (!phone || !token) {
      console.error('Phone or OTP token not found in the hook payload record.');
      // It's important to throw an error here so Supabase knows the hook failed.
      throw new Error('Invalid payload structure from Supabase hook.');
    }

    // Prepare the request for the Kavenegar API.
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append('receptor', phone);
    params.append('token', token);
    params.append('template', 'logincode');

    const kavenegarResponse = await fetch(url, {
      method: 'POST',
      body: params,
    });

    const responseData = await kavenegarResponse.json();

    // Check if the request to Kavenegar was successful.
    if (!kavenegarResponse.ok || responseData?.return?.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API request failed with status: ${kavenegarResponse.status}`);
    }
    
    console.log('Successfully sent OTP via Kavenegar for phone:', phone);

    // Send a success response back to Supabase.
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Critical error in Kavenegar Edge Function:', err.message);
    // Return a server error response so Supabase knows the hook invocation failed.
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
