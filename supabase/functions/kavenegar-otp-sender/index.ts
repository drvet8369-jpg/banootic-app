import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Get the Kavenegar API key from the environment variables set in the Supabase dashboard.
const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // This is needed for the browser's pre-flight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in the Edge Function environment variables.');
    }

    // Supabase Auth Hooks send data in a nested `record` object.
    // We must read the data from `body.record`.
    const body = await req.json();
    const phone = body?.record?.phone;
    const token = body?.record?.token;

    if (!phone || !token) {
      console.error('Hook payload did not contain phone or token in `body.record`. Payload:', JSON.stringify(body, null, 2));
      throw new Error('Phone number and token were not found in the expected hook payload format.');
    }
    
    // The phone number from Supabase auth is already in E.164 format (e.g., +989...).
    // We just need to remove the '+' for the Kavenegar API.
    const receptor = phone.replace('+', '');
    const template = 'HonarBanoo-Verify'; // Ensure this template name is correct in your Kavenegar panel.

    const url = new URL(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`);
    url.searchParams.append('receptor', receptor);
    url.searchParams.append('token', token);
    url.searchParams.append('template', template);

    const kavenegarResponse = await fetch(url.toString());

    if (!kavenegarResponse.ok) {
      const errorText = await kavenegarResponse.text();
      console.error('Kavenegar API Error:', errorText);
      throw new Error(`Kavenegar API request failed with status: ${kavenegarResponse.status}. Response: ${errorText}`);
    }

    // Return a success response to Supabase.
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Critical Error in Kavenegar Edge Function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
