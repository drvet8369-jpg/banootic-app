import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { KAVENEGAR_API_KEY } from '../_shared/secrets.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    if (!KAVENEGAR_API_KEY || KAVENEGAR_API_KEY === "YOUR_KAVENEGAR_API_KEY_HERE") {
      throw new Error('Kavenegar API Key is not configured in _shared/secrets.ts');
    }

    const payload = await req.json();
    const phone = payload.phone;
    const token = payload.token;

    if (!phone || !token) {
      throw new Error('Phone number or token is missing from the request body.');
    }
    
    // Normalize phone number to be without the leading '+' or '00' for Kavenegar
    const receptor = phone.replace(/^\+98/, '0');

    const kavenegarUrl = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams({
      receptor: receptor,
      token: token,
      template: 'banootik-verify',
    });

    const response = await fetch(`${kavenegarUrl}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kavenegar API Error: ${response.status} ${errorText}`);
    }

    return new Response(JSON.stringify({ message: "OTP sent successfully via Kavenegar." }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
