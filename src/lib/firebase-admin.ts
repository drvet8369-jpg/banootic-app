import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This file is for server-side (Genkit) Firebase access ONLY.

let adminDb: admin.firestore.Firestore;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Initialize the app only if it hasn't been initialized yet and a service key is provided.
  if (serviceAccountKey && !admin.apps.length) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminDb = getFirestore();
  } else if (admin.apps.length > 0) {
    // If the app is already initialized, just get the firestore instance
    adminDb = getFirestore(admin.app());
  }
  // If serviceAccountKey is missing, adminDb will remain uninitialized.
  // Functions calling it will need to handle this case gracefully.

} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // We don't throw here to prevent the entire app from crashing on start,
  // but dependent features will not work. Errors will be caught in the flows.
}

// Export the initialized database instance (or undefined).
export { adminDb };
