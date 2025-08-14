import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This file is for server-side (Genkit & API Routes) Firebase access ONLY.

let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey && !admin.apps.length) {
    // Check if the key is a stringified JSON or a JSON object
    const serviceAccount = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    adminDb = getFirestore();
    adminAuth = getAuth();
    console.log("Firebase Admin SDK initialized successfully.");

  } else if (admin.apps.length > 0) {
    adminDb = getFirestore(admin.app());
    adminAuth = getAuth(admin.app());
  } else {
    console.warn("Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables. Server-side Firebase features will be unavailable.");
  }

} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

export { adminDb, adminAuth };
