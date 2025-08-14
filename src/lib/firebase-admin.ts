import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This file is for server-side (Genkit & API Routes) Firebase access ONLY.

let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Correctly parse the service account key
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
    
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized successfully.");
    }
    
    adminDb = getFirestore();
    adminAuth = getAuth();
  } else {
    console.warn("Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables. Server-side Firebase features will be unavailable.");
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

export { adminDb, adminAuth };
