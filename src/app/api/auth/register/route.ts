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
      return NextResponse.json({ message: 'This phone number is already registered.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    const userRecord = await adminAuth.createUser({
        uid: uid,
        phoneNumber: uid,
        displayName: values.name
    });

    if (values.accountType === 'provider') {
        const selectedCategory = categories.find(c => c.slug === values.serviceType);
        
        const newProviderData: Provider = {
            id: uid,
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
        
        const providerDocRef = adminDb.collection('providers').doc(uid);
        await providerDocRef.set(newProviderData);
    }

    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    return NextResponse.json({ token: customToken }, { status: 201 });

  } catch (error: any) {
    console.error('API /auth/register Error:', error);
    const errorMessage = error.message || 'An internal server error occurred.';
    return NextResponse.json({ message: `Firebase Admin SDK Error: ${errorMessage}` }, { status: 500 });
  }
}
