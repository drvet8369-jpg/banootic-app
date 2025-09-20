// supabase/functions/kavenegar-otp-sender/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is a preflight request. We don't need to do anything special here.
  // We just need to return the CORS headers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the API key from the request headers, passed from the server action
    const KAVEHNEGAR_API_KEY = req.headers.get('x-kavehnegar-api-key');
    
    // Critical check for API key
    if (!KAVEHNEGAR_API_KEY) {
      console.error('Kavenegar API key not found in request headers.');
      throw new Error('Kavenegar API Key is not provided.');
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
    const params = new URLSearchParams({
      receptor: phone,
      template: templateName,
      token: token,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    const responseBodyText = await response.text();
    console.log(`Kavenegar API response status: ${response.status}`);
    console.log(`Kavenegar API response body: ${responseBodyText}`);

    if (!response.ok) {
      throw new Error(`Kavenegar API request failed with status ${response.status}: ${responseBodyText}`);
    }

    let responseData;
    try {
        responseData = JSON.parse(responseBodyText);
    } catch (e) {
        throw new Error(`Failed to parse Kavenegar JSON response: ${responseBodyText}`);
    }
    
    if (responseData.return.status !== 200) {
        throw new Error(`Kavenegar returned an error: ${responseData.return.message}`);
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('CRITICAL ERROR in Kavenegar OTP sender:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
