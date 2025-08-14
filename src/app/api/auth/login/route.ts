import { adminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth) {
      return NextResponse.json({ message: "Firebase Admin SDK not initialized." }, { status: 500 });
    }

    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }

    // Check if the user already exists in Firebase Auth, if not, create them
    try {
        await adminAuth.getUserByPhoneNumber(`+98${phone.substring(1)}`);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            await adminAuth.createUser({
                uid: phone, // Use phone number as UID for simplicity
                phoneNumber: `+98${phone.substring(1)}`,
                displayName: `کاربر ${phone.slice(-4)}`
            });
        } else {
            // For other errors during getUser, rethrow
            throw error;
        }
    }
    
    // Create a custom token for the user, using their phone number as UID
    const customToken = await adminAuth.createCustomToken(phone);

    return NextResponse.json({ token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('API /auth/login Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
