import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in environment variables.');
    }

    // Correctly parse the nested payload from Supabase Auth Hooks
    const body = await req.json();
    const { phone, otp: token } = body.record;
    
    if (!phone || !token) {
      console.error('Phone or token not found in body.record. Payload received:', JSON.stringify(body, null, 2));
      throw new Error('Phone number and token are required in the `record` object.');
    }

    const receptor = phone.replace('+', '');
    const template = 'logincode';

    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append('receptor', receptor);
    params.append('token', token);
    params.append('template', template);

    const kavenegarResponse = await fetch(url, {
      method: 'POST',
      body: params,
    });

    const responseData = await kavenegarResponse.json();

    if (kavenegarResponse.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    return new Response(JSON.stringify({}), {
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
