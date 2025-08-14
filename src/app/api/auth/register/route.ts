import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import type { Provider, User } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { categories, services } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized. Cannot process registration.");
    }
    
    const values = await req.json();

    // Basic validation
    if (!values.name || !values.phone || !values.accountType) {
        return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // Check if user already exists in Firebase Auth
    try {
      await adminAuth.getUser(values.phone);
      // If the above line doesn't throw, the user exists
      return NextResponse.json({ message: 'This phone number is already registered.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        // For errors other than 'not found', it's an issue
        throw error;
      }
      // If user is not found, we can proceed with creation
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
        uid: values.phone,
        phoneNumber: `+98${values.phone.substring(1)}`,
        displayName: values.name
    });

    // If it's a provider, create a document in the 'providers' collection
    if (values.accountType === 'provider') {
        const selectedCategory = categories.find(c => c.slug === values.serviceType);
        const firstServiceInCat = services.find(s => s.categorySlug === selectedCategory?.slug);
        
        const newProvider: Provider = {
            id: Date.now(), // Using timestamp as a simple unique ID
            name: values.name,
            phone: values.phone,
            service: selectedCategory?.name || 'خدمت جدید',
            location: 'ارومیه',
            bio: values.bio || '',
            categorySlug: selectedCategory?.slug || 'beauty',
            serviceSlug: firstServiceInCat?.slug || 'manicure-pedicure',
            rating: 0,
            reviewsCount: 0,
            profileImage: { src: '', aiHint: 'woman portrait' },
            portfolio: [],
        };
        
        const providerDocRef = adminDb.collection('providers').doc(newProvider.phone);
        await providerDocRef.set(newProvider);
    }

    // Create custom token to sign in the user on the client side
    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    return NextResponse.json({ token: customToken }, { status: 201 });

  } catch (error: any) {
    console.error('API /auth/register Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
