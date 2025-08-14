import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import type { Provider } from '@/lib/types';
import { categories, services } from '@/lib/data';


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
  console.error('CRITICAL: Firebase admin initialization failed in register route.', error);
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAuth();
    const adminDb = getFirestore();
    
    const values = await req.json();

    if (!values.name || !values.phone || !values.accountType) {
        return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const uid = `+98${values.phone.substring(1)}`;

    try {
      await adminAuth.getUser(uid);
      return NextResponse.json({ message: 'This phone number is already registered.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // User does not exist, which is what we want. Continue.
    }

    const userRecord = await adminAuth.createUser({
        uid: uid,
        phoneNumber: uid,
        displayName: values.name
    });

    if (values.accountType === 'provider') {
        const selectedCategory = categories.find(c => c.slug === values.serviceType);
        
        const newProviderData: Omit<Provider, 'id'> = {
            name: values.name,
            phone: values.phone,
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه',
            bio: values.bio || '',
            categorySlug: selectedCategory?.slug || 'beauty',
            serviceSlug: services.find(s => s.categorySlug === selectedCategory?.slug)?.slug || 'manicure-pedicure',
            rating: 0,
            reviewsCount: 0,
            profileImage: { src: '', aiHint: 'woman portrait' },
            portfolio: [],
        };
        
        // Use the phone number (without +98) as the document ID for consistency
        const providerDocRef = adminDb.collection('providers').doc(values.phone);
        await providerDocRef.set({ ...newProviderData, id: values.phone });
    }

    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    return NextResponse.json({ token: customToken }, { status: 201 });

  } catch (error: any) {
    console.error('API /auth/register Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
