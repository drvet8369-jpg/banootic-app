'use server';

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please ensure it is in your .env.local file.');
    }
    
    // Decode and parse the service account key
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('CRITICAL: Firebase admin initialization failed.', error.message);
    // Throw an error to make it clear that the server cannot start without proper config.
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

adminDb = getFirestore();
adminAuth = getAuth();

export { adminDb, adminAuth };
