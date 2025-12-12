
import { NextResponse } from 'next/server';

// This is a secure, server-side-only environment.
const KAVENEGAR_API_KEY = "425A38756C724A503571315964352B4E416946316754754B33616B7652526E6B706779327131496F756A453D";

export async function POST(request: Request) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return NextResponse.json({ error: "Phone number and token are required." }, { status: 400 });
    }

    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
    const params = new URLSearchParams();
    params.append("receptor", phone);
    params.append("token", token);
    params.append("template", "logincode");

    const kavenegarResponse = await fetch(url, {
      method: "POST",
      body: params,
    });

    const responseData = await kavenegarResponse.json();

    if (kavenegarResponse.status !== 200 || responseData.return.status !== 200) {
      console.error('Kavenegar API Error in API Route:', responseData);
      throw new Error(responseData?.return?.message || `Kavenegar API failed with status: ${kavenegarResponse.status}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully." });

  } catch (err: any) {
    console.error("Error in /api/send-otp:", err);
    return NextResponse.json({ error: err.message || "An unknown error occurred." }, { status: 500 });
  }
}
