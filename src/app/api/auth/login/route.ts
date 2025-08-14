import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  if (!adminAuth) {
    return NextResponse.json({ error: 'Authentication service not available.' }, { status: 500 });
  }

  try {
    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number provided.' }, { status: 400 });
    }

    // In a real application, you would perform verification here (e.g., an OTP).
    // For this demo, we'll create a user in Firebase Auth if they don't exist,
    // and then generate a custom token for them to sign in with on the client.
    
    const uid = phone; // Use phone number as UID for simplicity in this app

    try {
      // Check if user exists. If not, this throws an error and we create the user in the catch block.
      await adminAuth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, so create them in Firebase Auth.
        await adminAuth.createUser({
          uid: uid,
          phoneNumber: `+98${phone.substring(1)}`, // E.164 format for Firebase Auth
        });
      } else {
        // Some other unexpected error occurred
        console.error('Error getting user in login endpoint:', error);
        throw error;
      }
    }

    // By now, the user is guaranteed to exist in Firebase Auth.
    // Create a custom token for them to sign in with on the client.
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken });

  } catch (error) {
    console.error('Error in login/signup endpoint:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
