import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The main function that handles requests.
serve(async (req: Request) => {
  // This is needed for the browser's pre-flight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Verify that the Kavenegar API key is available.
    if (!KAVENEGAR_API_KEY) {
      throw new Error('Kavenegar API key is not set in environment variables.');
    }

    // 2. Extract the payload from the request body.
    // Supabase Auth Hooks send data nested inside a 'record' object.
    const { record } = await req.json();
    const phone = record?.phone;
    const token = record?.otp; // Supabase sends the OTP in a field named 'otp' inside the record.

    if (!phone || !token) {
      console.error('Phone or token not found in body.record. Payload received:', JSON.stringify(record, null, 2));
      throw new Error('Phone number and OTP token are required in the `record` object.');
    }

    // 3. Prepare and send the request to Kavenegar API.
    // Kavenegar expects the phone number without the leading '+98'
    const receptor = phone.startsWith('+98') ? phone.substring(3) : phone;
    
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append('receptor', receptor);
    params.append('token', token);
    params.append('template', 'logincode');

    const kavenegarResponse = await fetch(url, {
      method: 'POST',
      body: params,
    });

    // 4. Handle the response from Kavenegar.
    const responseData = await kavenegarResponse.json();

    if (!kavenegarResponse.ok || (responseData.return && responseData.return.status !== 200)) {
       console.error('Kavenegar API Error:', responseData);
       throw new Error(responseData?.return?.message || `Kavenegar API request failed with status: ${kavenegarResponse.status}`);
    }

    // 5. Send a success response back to Supabase.
    return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully via Kavenegar.' }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Catch any errors and return a proper server error response.
    console.error('Error in Kavenegar Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for client-side errors, which is more appropriate here.
    });
  }
});
