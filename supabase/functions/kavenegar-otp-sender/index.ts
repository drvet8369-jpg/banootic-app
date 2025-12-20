import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This is the final, standard version of the function.
serve(async (req: Request) => {
  // Handle the pre-flight OPTIONS request for CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Kavenegar API Key must be set in the function's secrets.
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in environment variables.');
    }

    // Supabase sends the data within a 'record' object. This is the correct path.
    const { record } = await req.json();
    const phone = record?.phone;
    const token = record?.otp;

    // Check if the necessary data is present.
    if (!phone || !token) {
      throw new Error(`'phone' or 'otp' not found in the request body record. Received: ${JSON.stringify(record)}`);
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

    // Check if the request to Kavenegar was successful.
    if (!kavenegarResponse.ok) {
        const errorText = await kavenegarResponse.text();
        throw new Error(`Kavenegar API request failed with status ${kavenegarResponse.status}: ${errorText}`);
    }

    const responseData = await kavenegarResponse.json();

    // Check for application-level errors from Kavenegar.
    if (responseData?.return?.status !== 200) {
      throw new Error(responseData?.return?.message || 'Kavenegar returned a non-200 status in its response.');
    }

    // Send a success response back to Supabase.
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Catch any errors and return a proper server error response.
    console.error('Error in Kavenegar Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500, // Return a 500 status to indicate failure to Supabase.
    });
  }
});
