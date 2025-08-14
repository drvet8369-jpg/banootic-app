import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please ensure it is in your .env.local file.');
    }
    
    // Correctly decode and parse the service account key
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error('CRITICAL: Firebase admin initialization failed.', error);
    // We throw an error to make it clear that the server cannot start without proper config.
    throw new Error('Firebase Admin SDK initialization failed.');
  }
}

adminDb = getFirestore();
adminAuth = getAuth();

export { adminDb, adminAuth };
