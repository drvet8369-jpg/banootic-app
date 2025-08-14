import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import type { Provider } from '@/lib/types';
import { categories, services } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ message: "Firebase Admin SDK not initialized." }, { status: 500 });
    }
    
    const values = await req.json();

    if (!values.name || !values.phone || !values.accountType) {
        return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    try {
      await adminAuth.getUserByPhoneNumber(`+98${values.phone.substring(1)}`);
      return NextResponse.json({ message: 'This phone number is already registered.' }, { status: 409 });
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    const userRecord = await adminAuth.createUser({
        uid: values.phone,
        phoneNumber: `+98${values.phone.substring(1)}`,
        displayName: values.name
    });

    if (values.accountType === 'provider') {
        const selectedCategory = categories.find(c => c.slug === values.serviceType);
        
        const newProvider: Omit<Provider, 'id'> = {
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
        
        const providerDocRef = adminDb.collection('providers').doc(newProvider.phone);
        await providerDocRef.set(newProvider);
    }

    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    return NextResponse.json({ token: customToken }, { status: 201 });

  } catch (error: any) {
    console.error('API /auth/register Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
