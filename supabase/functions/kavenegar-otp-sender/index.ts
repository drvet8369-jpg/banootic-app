
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Direct API Key for simplicity in this development environment
const KAVENEGAR_API_KEY = "425A38756C724A503571315964352B4E416946316754754B33616B7652526E6B706779327131496F756A453D";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { receptor, token, template } = await req.json();

    if (!receptor || !token || !template) {
      throw new Error("Missing required parameters: receptor, token, or template.");
    }
    
    if (!KAVENEGAR_API_KEY || KAVENEGAR_API_KEY.includes('YOUR_API_KEY')) {
       console.error("Kavenegar API key is not set correctly in the Edge Function.");
       throw new Error("Kavenegar API key is not configured on the server.");
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
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 200,
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 500,
    });
  }
});
