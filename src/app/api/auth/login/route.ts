'use server';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^(09)\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number provided.' }, { status: 400 });
    }

    const uid = phone; 
    const e164PhoneNumber = `+98${phone.substring(1)}`;

    try {
      await adminAuth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await adminAuth.createUser({
          uid: uid,
          phoneNumber: e164PhoneNumber,
          displayName: `کاربر ${uid.slice(-4)}`
        });
      } else {
        throw error; // Rethrow other errors
      }
    }

    const customToken = await adminAuth.createCustomToken(uid);
    return NextResponse.json({ token: customToken });

  } catch (error: any) {
    console.error('CRITICAL Error in login/signup endpoint:', error);
    // Provide a more generic error to the client for security
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
