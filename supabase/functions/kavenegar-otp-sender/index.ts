
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const KAVENEGAR_API_KEY = Deno.env.get("KAVEHNEGAR_API_KEY");

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { receptor, token, template } = await req.json();

    if (!KAVENEGAR_API_KEY) {
      throw new Error("Kavenegar API key is not set in environment variables.");
    }
    if (!receptor || !token || !template) {
      throw new Error("Missing required parameters: receptor, token, or template.");
    }

    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append("receptor", receptor);
    params.append("token", token);
    params.append("template", template);

    const kavenegarResponse = await fetch(url, {
      method: "POST",
      body: params,
    });

    const responseData = await kavenegarResponse.json();

    if (kavenegarResponse.status !== 200 || responseData.return.status !== 200) {
      console.error('Kavenegar API Error:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    return new Response(JSON.stringify({ success: true, messageId: responseData.entries[0].messageid }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
       },
      status: 500,
    });
  }
});
