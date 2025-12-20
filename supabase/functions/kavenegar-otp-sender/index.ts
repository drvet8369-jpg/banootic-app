import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// --- Helper for CORS headers ---
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Main server function ---
serve(async (req: Request) => {
  // Handle pre-flight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Get the Kavenegar API key from environment variables.
    // This is set in the Supabase dashboard under Edge Functions > kavenegar-otp-sender > Secrets.
    const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in environment variables.');
    }

    // 2. Extract the payload from the request body.
    // Supabase Auth Hooks send data nested inside a 'record' object.
    const { record } = await req.json();
    const { phone, token } = record;

    // 3. Validate that we have the phone and token.
    if (!phone || !token) {
      console.error('Phone or token not found in body.record. Payload received:', JSON.stringify(record, null, 2));
      throw new Error('Phone number and OTP token are required in the `record` object.');
    }

    // 4. Prepare and send the request to the Kavenegar API.
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    // Kavenegar expects the phone number without the leading '+'.
    params.append('receptor', phone.replace('+', ''));
    params.append('token', token);
    params.append('template', 'logincode');

    const kavenegarResponse = await fetch(url, {
      method: 'POST',
      body: params,
    });

    // 5. Handle the response from Kavenegar.
    const responseData = await kavenegarResponse.json();

    if (kavenegarResponse.status !== 200 || (responseData.return && responseData.return.status !== 200)) {
       console.error('Kavenegar API Error:', responseData);
       throw new Error(responseData?.return?.message || `Kavenegar API request failed with status: ${kavenegarResponse.status}`);
    }

    // 6. Return a success response to Supabase.
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Catch any unexpected errors and return a server error response.
    console.error('Critical Error in Kavenegar Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
