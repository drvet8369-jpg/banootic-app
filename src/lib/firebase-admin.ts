import 'dotenv/config' // Make sure this is at the very top
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;

// This check prevents re-initializing the app in a hot-reload environment
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    
    // Correctly parse the service account key
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('CRITICAL: Firebase admin initialization failed.', error.message);
    // In a real app, you might want to handle this more gracefully
  }
}

// It's safer to get the instances after the initialization block
try {
    adminDb = getFirestore();
    adminAuth = getAuth();
} catch (error) {
    console.error("CRITICAL: Failed to get Firestore or Auth instance from Firebase Admin app.", error);
}

export { adminDb, adminAuth };
