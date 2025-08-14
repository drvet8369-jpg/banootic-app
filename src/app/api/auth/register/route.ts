import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import type { Provider } from '@/lib/types';
import { categories, services } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const values = await req.json();
    const { phone, name, accountType, serviceType, bio } = values;

    if (!name || !phone || !accountType) {
        return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const uid = `+98${phone.substring(1)}`;

    // Check if user already exists
    try {
      await adminAuth.getUser(uid);
      // If getUser doesn't throw, the user exists
      return NextResponse.json({ message: 'This phone number is already registered.' }, { status: 409 });
    } catch (error: any) {
      // "user-not-found" is the expected error, so we can continue.
      // Any other error code is a problem.
      if (error.code !== 'auth/user-not-found') {
        console.error('Error checking for user:', error);
        throw error;
      }
    }

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
        uid: uid,
        phoneNumber: uid,
        displayName: name
    });

    // If the user is a provider, create a document in the 'providers' collection
    if (accountType === 'provider') {
        const selectedCategory = categories.find(c => c.slug === serviceType);
        
        const newProviderData: Provider = {
            id: uid,
            name: name,
            phone: phone, // Store the plain phone number
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه', // Default location
            bio: bio || '',
            categorySlug: selectedCategory?.slug || 'beauty',
            serviceSlug: services.find(s => s.categorySlug === selectedCategory?.slug)?.slug || 'manicure-pedicure',
            rating: 0,
            reviewsCount: 0,
            profileImage: { src: '', aiHint: 'woman portrait' },
            portfolio: [],
        };
        
        const providerDocRef = adminDb.collection('providers').doc(uid);
        await providerDocRef.set(newProviderData);
    }

    // Create a custom token for the new user to sign in
    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    return NextResponse.json({ token: customToken }, { status: 201 });

  } catch (error: any) {
    console.error('API /auth/register Error:', error);
    const errorMessage = error.message || 'An internal server error occurred.';
    return NextResponse.json({ message: `Registration failed: ${errorMessage}` }, { status: 500 });
  }
}
