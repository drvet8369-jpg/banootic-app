import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth) {
      throw new Error("Firebase Admin SDK not initialized. Cannot process authentication.");
    }

    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }

    // Check if the user already exists in Firebase Auth
    try {
        await adminAuth.getUser(phone);
    } catch (error: any) {
        // If user not found, create them
        if (error.code === 'auth/user-not-found') {
            await adminAuth.createUser({
                uid: phone,
                phoneNumber: `+98${phone.substring(1)}`, // Assuming Iranian phone numbers
                displayName: `کاربر ${phone.slice(-4)}`
            });
        } else {
            // For other errors, rethrow
            throw error;
        }
    }
    
    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(phone);

    return NextResponse.json({ token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('API /auth/login Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
