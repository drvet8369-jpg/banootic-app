import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This file is for server-side (Genkit) Firebase access ONLY.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Firebase admin initialization error', e.stack);
  }
}

export const adminDb = getFirestore();
