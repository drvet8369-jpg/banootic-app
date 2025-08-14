import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This file is for server-side (Genkit & API Routes) Firebase access ONLY.

let adminDb: admin.firestore.Firestore | undefined;
let adminAuth: admin.auth.Auth | undefined;

// Ensure the service account key is available.
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountKey) {
  try {
    // Initialize the app only if it hasn't been initialized yet.
    if (!admin.apps.length) {
      // Parse the service account key JSON string.
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      adminDb = getFirestore();
      adminAuth = getAuth();
      console.log("Firebase Admin SDK initialized successfully.");
    } else {
      // If the app is already initialized, just get the instances.
      adminDb = getFirestore(admin.app());
      adminAuth = getAuth(admin.app());
    }
  } catch (error) {
    console.error('CRITICAL: Firebase admin initialization failed.', error);
  }
} else {
  console.warn("Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables. Server-side Firebase features will be unavailable.");
}


export { adminDb, adminAuth };
