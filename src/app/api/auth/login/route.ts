import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }
    
    const uid = `+98${phone.substring(1)}`;
    
    try {
        await adminAuth.getUser(uid);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ message: "User not found. Please register." }, { status: 404 });
        }
        throw error;
    }
    
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('API /auth/login Error:', error);
    const errorMessage = error.message || 'An internal server error occurred.';
    return NextResponse.json({ message: `Firebase Admin SDK Error: ${errorMessage}` }, { status: 500 });
  }
}
