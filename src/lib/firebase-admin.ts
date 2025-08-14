import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This file is for server-side (Genkit) Firebase access ONLY.

let adminDb: admin.firestore.Firestore | undefined;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Initialize the app only if it hasn't been initialized yet and a service key is provided.
  if (serviceAccountKey && !admin.apps.length) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount.project_id ? serviceAccount : JSON.parse(serviceAccount as any)),
    });
    adminDb = getFirestore();
    console.log("Firebase Admin SDK initialized successfully.");
  } else if (admin.apps.length > 0) {
    // If the app is already initialized, just get the firestore instance
    adminDb = getFirestore(admin.app());
  } else {
    // If serviceAccountKey is missing, adminDb will remain uninitialized.
    // Functions calling it will need to handle this case gracefully.
    console.warn("Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables. Server-side Firebase features will be unavailable.");
  }

} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // We don't throw here to prevent the entire app from crashing on start,
  // but dependent features will not work. Errors will be caught in the flows.
  // `adminDb` will remain undefined.
}

// Export the initialized database instance (or undefined).
export { adminDb };
