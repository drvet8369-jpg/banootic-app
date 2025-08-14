import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }
    
    // Convert to E.164 format for Firebase Auth UID
    const uid = `+98${phone.substring(1)}`;
    
    try {
        // Check if user exists. If not, this will throw an error.
        await adminAuth.getUser(uid);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ message: "User not found. Please register." }, { status: 404 });
        }
        // For other errors, log them and return a generic server error
        console.error('Firebase Admin Auth error:', error);
        return NextResponse.json({ message: 'An error occurred during authentication.' }, { status: 500 });
    }
    
    // If user exists, create a custom token for them to sign in
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('API /auth/login Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
