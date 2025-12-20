import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { KAVENEGAR_API_KEY } from '../_shared/secrets.ts';

// These headers are required for the browser (CORS) and Supabase Functions.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // This is needed for the OPTIONS pre-flight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in secrets.ts');
    }

    // Supabase sends the data in a nested `record` object for auth hooks.
    const body = await req.json();
    const phone = body?.record?.phone;
    const token = body?.record?.token;

    if (!phone || !token) {
      console.error('Hook payload was missing phone or token:', JSON.stringify(body, null, 2));
      throw new Error('Phone number and token were not found in the hook payload (body.record).');
    }

    // The phone number from Supabase is already in the correct international format (e.g., +989...).
    // We only need to remove the '+' for the Kavenegar API.
    const receptor = phone.replace('+', '');
    const template = 'HonarBanoo-Verify';
    const type = 'sms';

    // Construct the Kavenegar API URL
    const url = new URL(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`);
    url.searchParams.append('receptor', receptor);
    url.searchParams.append('token', token);
    url.searchParams.append('template', template);
    url.searchParams.append('type', type);
    
    // Make the request to the Kavenegar API
    const kavenegarResponse = await fetch(url.toString());

    if (!kavenegarResponse.ok) {
      const errorText = await kavenegarResponse.text();
      throw new Error(`Kavenegar API request failed: ${kavenegarResponse.status} ${errorText}`);
    }

    // On success, return a 200 OK response.
    return new Response(JSON.stringify({ message: 'OTP sent successfully via Kavenegar.' }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // If any error occurs, log it and return a 500 Internal Server Error.
    console.error('Error in Kavenegar Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
