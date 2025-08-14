import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // The adminAuth object is now guaranteed to be initialized if the server started.
    const { phone } = await req.json();

    if (!phone || !/^(09)\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number provided.' }, { status: 400 });
    }

    const uid = phone; // Use phone number as UID for simplicity in this app
    const e164PhoneNumber = `+98${phone.substring(1)}`;

    try {
      // Check if user exists. If not, this throws an error and we create the user in the catch block.
      await adminAuth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, so create them in Firebase Auth.
        console.log(`User ${uid} not found. Creating new user in Firebase Auth.`);
        await adminAuth.createUser({
          uid: uid,
          phoneNumber: e164PhoneNumber,
          displayName: `کاربر ${uid.slice(-4)}`
        });
      } else {
        // Some other unexpected error occurred
        console.error(`Error getting user ${uid} in login endpoint:`, error);
        return NextResponse.json({ error: 'Failed to verify user with Firebase.', details: error.message }, { status: 500 });
      }
    }

    // By now, the user is guaranteed to exist in Firebase Auth.
    // Create a custom token for them to sign in with on the client.
    console.log(`Creating custom token for user ${uid}.`);
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken });

  } catch (error: any) {
    console.error('CRITICAL Error in login/signup endpoint:', error);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
}
