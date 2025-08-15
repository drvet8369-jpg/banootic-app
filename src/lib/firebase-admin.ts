import admin from 'firebase-admin';

// This file is for server-side (Next.js Server Actions) Firebase access ONLY.

let adminDb: admin.firestore.Firestore;

// Initialize the app only if it hasn't been initialized yet.
if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, the service account key is automatically provided.
    // For local development, you'd need to set the GOOGLE_APPLICATION_CREDENTIALS env var.
    admin.initializeApp();
    adminDb = admin.firestore();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('CRITICAL: Firebase admin initialization failed.', error);
    // We throw here to make it clear that server-side functionality will not work.
    throw new Error(`Firebase admin initialization failed: ${error.message}`);
  }
} else {
  // If the app is already initialized, just get the firestore instance.
  adminDb = admin.firestore();
}

// Export the initialized database instance.
export { adminDb };
