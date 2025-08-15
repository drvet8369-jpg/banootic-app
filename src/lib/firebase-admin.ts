import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK if it hasn't been initialized yet.
 * This is safe to call multiple times.
 */
function initializeAdminApp() {
  if (admin.apps.length === 0) {
    // When deployed to App Hosting, service account credentials are automatically
    // configured. For local development, set up Application Default Credentials.
    // https://firebase.google.com/docs/hosting/server-side-rendering-frameworks#admin-sdk
    admin.initializeApp();
  }
}

/**
 * Gets the server-side Firestore database instance.
 * Ensures the Firebase Admin SDK is initialized before returning the database instance.
 *
 * @returns {admin.firestore.Firestore} The Firestore database instance.
 */
export function getAdminDb(): admin.firestore.Firestore {
  initializeAdminApp();
  return admin.firestore();
}
