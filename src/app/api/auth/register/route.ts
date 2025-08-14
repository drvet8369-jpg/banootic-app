import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import type { Provider } from '@/lib/types';
import { categories, services } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const values = await req.json();

    if (!values.name || !values.phone || !values.accountType) {
        return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const uid = `+98${values.phone.substring(1)}`;

    try {
      await adminAuth.getUser(uid);
      // If the above line doesn't throw, the user already exists.
      return NextResponse.json({ message: 'This phone number is already registered.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        // For any other error (e.g., network issues), re-throw it.
        throw error;
      }
      // If the error is 'auth/user-not-found', we can proceed with creating the user.
      console.log(`Phone number ${uid} is available. Proceeding with registration.`);
    }

    // Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
        uid: uid,
        phoneNumber: uid,
        displayName: values.name
    });

    // If the user is a provider, create a corresponding document in Firestore
    if (values.accountType === 'provider') {
        const selectedCategory = categories.find(c => c.slug === values.serviceType);
        
        const newProviderData: Omit<Provider, 'id'> = {
            name: values.name,
            phone: values.phone,
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه', // Default location
            bio: values.bio || '',
            categorySlug: selectedCategory?.slug || 'beauty',
            serviceSlug: services.find(s => s.categorySlug === selectedCategory?.slug)?.slug || 'manicure-pedicure',
            rating: 0,
            reviewsCount: 0,
            profileImage: { src: '', aiHint: 'woman portrait' },
            portfolio: [],
        };
        
        // Use the plain phone number (e.g., 0912...) as the document ID for consistency
        const providerDocRef = adminDb.collection('providers').doc(values.phone);
        await providerDocRef.set({ ...newProviderData, id: values.phone });
    }

    // Create a custom token for the new user to sign in on the client
    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    return NextResponse.json({ token: customToken }, { status: 201 });

  } catch (error: any) {
    console.error('API /auth/register Error:', error);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
