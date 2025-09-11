// supabase/functions/kavenegar-otp-sender/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// These values will be set as environment variables in the Supabase dashboard secrets.
const KAVEHNEGAR_API_KEY = Deno.env.get('KAVEHNEGAR_API_KEY');

serve(async (req) => {
  // This is a preflight request. We don't need to do anything special here.
  // We just need to return the CORS headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Critical check for API key secret
    if (!KAVEHNEGAR_API_KEY) {
      console.error('Kavenegar secret not found. Please set KAVEHNEGAR_API_KEY in Supabase secrets.');
      throw new Error('Kavenegar API Key is not set in environment variables.');
    }

    const { phone, data } = await req.json();
    const token = data?.token; // The OTP code is passed by Supabase in the 'token' field
    const templateName = 'logincode'; // The template name as specified by the user

    if (!phone || !token) {
        console.error('Request body is missing phone or token.');
        throw new Error('Phone number or OTP token is missing in the request body.');
    }

    // The endpoint for the verify lookup API (for template-based sending)
    const url = `https://api.kavenegar.com/v1/${KAVEHNEGAR_API_KEY}/verify/lookup.json`;

    // The parameters need to be in a URL-encoded format for the POST body.
    // We now use `template` and `token` instead of `sender` and `message`.
    const params = new URLSearchParams({
      receptor: phone,
      template: templateName,
      token: token,
      // You can add token2 and token3 here if your template needs them
      // For example: token2: 'some value'
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
