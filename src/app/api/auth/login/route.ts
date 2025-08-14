import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error: any) {
  console.error('CRITICAL: Firebase admin initialization failed in login route.', error);
}


export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAuth();
    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json({ message: 'Invalid phone number format.' }, { status: 400 });
    }

    const uid = `+98${phone.substring(1)}`;

    // Ensure user exists in Firebase Auth
    try {
        await adminAuth.getUser(uid);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            await adminAuth.createUser({
                uid: uid,
                phoneNumber: uid,
                displayName: `کاربر ${phone.slice(-4)}`
            });
        } else {
            throw error; // Re-throw other errors
        }
    }
    
    // Create a custom token for the user
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken }, { status: 200 });

  } catch (error: any) {
    console.error('API /auth/login Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
