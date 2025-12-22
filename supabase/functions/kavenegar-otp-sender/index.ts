// supabase/functions/kavenegar-otp-sender/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// گرفتن API Key از محیط
const KAVENEGAR_API_KEY = Deno.env.get("KAVENEGAR_API_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// فانکشن اصلی
serve(async (req: Request) => {
  try {
    // OPTIONS برای Preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS });
    }

    // فقط POST مجازه
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // چک کردن API Key
    if (!KAVENEGAR_API_KEY) {
      throw new Error("Kavenegar API key is missing in environment variables.");
    }

    // گرفتن phone و token از body
    const body = await req.json();
    const { phone, token } = body;

    if (!phone || !token) {
      return new Response(
        JSON.stringify({ error: "Phone number and token are required." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ساخت URL و پارامترها برای Kavenegar
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append("receptor", phone);
    params.append("token", token);
    params.append("template", "logincode");

    // ارسال درخواست
    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (response.status !== 200 || data.return.status !== 200) {
      console.error("Kavenegar API error:", data);
      return new Response(
        JSON.stringify({ error: data.return?.message || "Failed to send OTP" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // موفقیت
    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully." }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
