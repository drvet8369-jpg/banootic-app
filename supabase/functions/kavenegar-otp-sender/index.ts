import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { phone, token } = await req.json();

    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in environment variables.');
    }
    if (!phone || !token) {
      throw new Error('Phone number and token are required.');
    }

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

    if (kavenegarResponse.status !== 200 || responseData.return.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully.' }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error in Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
