import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The main function that handles requests from the Supabase Hook.
serve(async (req: Request) => {
  // This is needed for the browser's pre-flight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Verify that the Kavenegar API key is available.
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in environment variables.');
    }

    // 2. Extract the entire payload from the request.
    // The data sent from the Supabase SMS hook is nested.
    // We access it via `payload.phone` and `payload.token`.
    const payload = await req.json();
    const phone = payload?.phone;
    const token = payload?.token;

    // 3. Validate that we received the necessary data from the hook.
    if (!phone || !token) {
      console.error("Invalid payload from Supabase hook:", payload);
      throw new Error('The phone number and token were not received correctly from the Supabase hook.');
    }

    // 4. Prepare and send the request to Kavenegar API.
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    // The receptor needs to be in the local format (e.g., 09xxxxxxxxx) for Kavenegar.
    // Supabase sends it in E.164 format (+989...), so we normalize it.
    const kavenegarReceptor = phone.replace('+98', '0');
    params.append('receptor', kavenegarReceptor);
    params.append('token', token);
    params.append('template', 'logincode');

    const kavenegarResponse = await fetch(url, {
      method: 'POST',
      body: params,
    });

    // 5. Handle the response from Kavenegar.
    const responseData = await kavenegarResponse.json();

    if (kavenegarResponse.status !== 200 || responseData.return.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    // 6. Send a success response back to Supabase.
    // An empty JSON object {} is sufficient to signal success.
    return new Response(JSON.stringify({}), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Catch any errors and return a proper server error response.
    console.error('Error in Kavenegar Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
