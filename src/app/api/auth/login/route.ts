import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }

    // The UID in Firebase Auth is the full international phone number
    const uid = `+98${phone.substring(1)}`;

    // Ensure user exists in Firebase Auth. If not, create them.
    // This is an "upsert" logic for login/registration via phone.
    try {
        await adminAuth.getUser(uid);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            await adminAuth.createUser({
                uid: uid,
                phoneNumber: uid,
                displayName: `کاربر ${phone.slice(-4)}`
            });
             console.log(`Created new user in Firebase Auth with UID: ${uid}`);
        } else {
            // For other errors, we re-throw to be caught by the outer catch block.
            throw error;
        }
    }
    
    // Create a custom token for the user to sign in on the client
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('API /auth/login Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
