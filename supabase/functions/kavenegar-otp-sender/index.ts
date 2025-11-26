// Follow this guide to deploy the function to your Supabase project:
// https://supabase.com/docs/guides/functions/deploy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // This is how to get the Kavenegar API key from the request headers
  const kavenegarApiKey = req.headers.get('x-kavenegar-api-key');

  if (!kavenegarApiKey) {
    return new Response(
      JSON.stringify({ error: 'Kavenegar API key is missing from headers.' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }

  try {
    const { phone, data } = await req.json();
    const { token } = data;

    // Use URLSearchParams to correctly format the request body for Kavenegar
    const params = new URLSearchParams();
    params.append('receptor', phone);
    params.append('token', token);
    params.append('template', 'logincode');

    const kavenegarUrl = `https://api.kavenegar.com/v1/${kavenegarApiKey}/verify/lookup.json`;

    const kavenegarResponse = await fetch(kavenegarUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!kavenegarResponse.ok) {
      const errorText = await kavenegarResponse.text();
      console.error('Kavenegar API Error:', errorText);
      return new Response(
        JSON.stringify({
          error: `خطا در ارسال پیامک از طریق کاوه‌نگار: ${errorText}`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: kavenegarResponse.status,
        }
      );
    }

    const responseData = await kavenegarResponse.json();

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Internal Function Error:', error);
    return new Response(
      JSON.stringify({ error: `خطای داخلی در تابع ابری: ${error.message}` }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
