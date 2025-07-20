import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This file is for server-side (Genkit) Firebase access ONLY.

let adminDb: admin.firestore.Firestore;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for server-side Firebase access.');
  }

  // Parse the service account key from the environment variable.
  const serviceAccount = JSON.parse(serviceAccountKey);

  // Initialize the app only if it hasn't been initialized yet.
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  // Get the Firestore instance. This should only be called after a successful initialization.
  adminDb = getFirestore();

} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // Re-throwing the error is important to prevent the application from running
  // in a broken state where `adminDb` is not a valid Firestore instance.
  // The process should exit or the error should be handled by the caller.
  throw new Error(`Firebase Admin SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// Export the initialized database instance.
export { adminDb };
