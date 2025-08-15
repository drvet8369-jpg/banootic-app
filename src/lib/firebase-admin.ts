import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK if it hasn't been initialized yet.
// It's safe to call this function multiple times.
function initializeAdminApp() {
  if (admin.apps.length === 0) {
    try {
      // When deployed to App Hosting, service account credentials are automatically
      // configured. For local development, set up Application Default Credentials.
      // https://firebase.google.com/docs/hosting/server-side-rendering-frameworks#admin-sdk
      admin.initializeApp();
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("CRITICAL: Firebase admin initialization failed.", error);
      // Re-throw a more specific error to be caught by callers.
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  }
}

/**
 * Gets the server-side Firestore database instance.
 * Ensures the Firebase Admin SDK is initialized before returning the database instance.
 * Throws an error if initialization fails.
 *
 * @returns {admin.firestore.Firestore} The Firestore database instance.
 */
export function getAdminDb(): admin.firestore.Firestore {
  initializeAdminApp();
  // This will only be reached if initializeApp() was successful.
  return admin.firestore();
}
