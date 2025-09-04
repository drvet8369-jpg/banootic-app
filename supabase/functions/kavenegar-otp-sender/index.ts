// supabase/functions/kavenegar-otp-sender/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// These values will be set as environment variables in the Supabase dashboard secrets.
const KAVEHNEGAR_API_KEY = Deno.env.get('KAVEHNEGAR_API_KEY');
const KAVEHNEGAR_SENDER_NUMBER = Deno.env.get('KAVEHNEGAR_SENDER_NUMBER');

serve(async (req) => {
  // This is a preflight request. We don't need to do anything special here.
  // We just need to return the CORS headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!KAVEHNEGAR_API_KEY || !KAVEHNEGAR_SENDER_NUMBER) {
      throw new Error('Kavenegar API Key or Sender Number is not set in environment variables.');
    }

    const { phone, data } = await req.json();
    const token = data?.token; // The OTP code is passed by Supabase in the 'token' field

    if (!phone || !token) {
        throw new Error('Phone number or OTP token is missing in the request body.');
    }

    // Construct the message with the OTP code.
    const message = `کد تایید شما در بانوتیک: ${token}`;

    // The endpoint for the send API
    const url = `https://api.kavenegar.com/v1/${KAVEHNEGAR_API_KEY}/sms/send.json`;

    // The parameters need to be in a URL-encoded format for the POST body
    const params = new URLSearchParams({
      receptor: phone,
      sender: KAVEHNEGAR_SENDER_NUMBER,
      message: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kavenegar API request failed with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Kavenegar API Response:", responseData);

    // Check for errors within the Kavenegar response body itself
    if (responseData.return.status !== 200) {
        throw new Error(`Kavenegar returned an error: ${responseData.return.message}`);
    }

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
