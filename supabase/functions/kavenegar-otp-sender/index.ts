// supabase/functions/kavenegar-otp-sender/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// These values will be set as environment variables in the Supabase dashboard.
const KAVEHNEGAR_API_KEY = Deno.env.get('KAVEHNEGAR_API_KEY');
const KAVEHNEGAR_TEMPLATE_NAME = Deno.env.get('KAVEHNEGAR_TEMPLATE_NAME');

serve(async (req) => {
  // This is a preflight request. We don't need to do anything special here.
  // We just need to return the CORS headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!KAVEHNEGAR_API_KEY || !KAVEHNEGAR_TEMPLATE_NAME) {
      throw new Error('Kavenegar API Key or Template Name is not set in environment variables.');
    }

    const { phone } = await req.json();
    
    // Supabase automatically generates and passes the OTP token when calling this hook.
    // However, for the Kavenegar Verify API, we only need to pass up to 10 tokens.
    // The hook will provide the token in the `data.token` field, but Kavenegar's
    // Verify API requires us to send the token as `token`, `token2`, `token3`.
    // Since Supabase's built-in OTP is a single token, we only need `token`.
    // Supabase will pass this token in the `data` field of the hook payload.
    const { data } = await req.json();
    const token = data.token;


    if (!phone || !token) {
        throw new Error('Phone number or OTP token is missing in the request body.');
    }

    // Construct the URL for Kavenegar's Verify Lookup API.
    const url = `https://api.kavenegar.com/v1/${KAVEHNEGAR_API_KEY}/verify/lookup.json`;

    // The parameters need to be URL encoded.
    const params = new URLSearchParams({
      receptor: phone,
      template: KAVEHNEGAR_TEMPLATE_NAME,
      token: token,
      type: 'sms', // We are sending an SMS.
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET', // Kavenegar Verify API uses GET
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kavenegar API request failed with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Kavenegar API Response:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in Kavenegar OTP sender:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
