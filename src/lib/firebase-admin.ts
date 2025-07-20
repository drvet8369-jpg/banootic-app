import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This file is for server-side (Genkit) Firebase access ONLY.

let db: admin.firestore.Firestore;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }
  const serviceAccount = JSON.parse(serviceAccountKey);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  db = getFirestore();

} catch (error) {
  console.error('Firebase admin initialization error:', error);
  // To prevent the app from running in a broken state, we can either
  // throw the error or assign a mock/null implementation to db.
  // For now, let's log the error and allow the app to run,
  // though Firestore-dependent features will fail.
  // A better approach in production might be to throw the error.
  db = {} as admin.firestore.Firestore; // Prevents crashing on import
}

export const adminDb = db;
