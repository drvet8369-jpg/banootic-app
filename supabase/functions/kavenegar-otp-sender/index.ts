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
    // Critical check for secrets
    if (!KAVEHNEGAR_API_KEY || !KAVEHNEGAR_SENDER_NUMBER) {
      console.error('Kavenegar secrets not found. Please set KAVEHNEGAR_API_KEY and KAVEHNEGAR_SENDER_NUMBER in Supabase secrets.');
      throw new Error('Kavenegar API Key or Sender Number is not set in environment variables.');
    }

    const { phone, data } = await req.json();
    const token = data?.token; // The OTP code is passed by Supabase in the 'token' field

    if (!phone || !token) {
        console.error('Request body is missing phone or token.');
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
      body: params.toString(), // Ensure body is a string
    });
    
    // Detailed logging for the response from Kavenegar
    const responseBodyText = await response.text();
    console.log(`Kavenegar API response status: ${response.status}`);
    console.log(`Kavenegar API response body: ${responseBodyText}`);

    if (!response.ok) {
      // If the request failed, throw a detailed error to be caught below
      throw new Error(`Kavenegar API request failed with status ${response.status}: ${responseBodyText}`);
    }

    // Try to parse the JSON, but handle if it's not JSON
    let responseData;
    try {
        responseData = JSON.parse(responseBodyText);
    } catch (e) {
        throw new Error(`Failed to parse Kavenegar JSON response: ${responseBodyText}`);
    }
    
    // Check for errors within the Kavenegar response body itself
    if (responseData.return.status !== 200) {
        throw new Error(`Kavenegar returned an error: ${responseData.return.message}`);
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // This will now log the detailed error from the try block
    console.error('CRITICAL ERROR in Kavenegar OTP sender:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
