import * as admin from 'firebase-admin';

// This file is for server-side (Admin SDK) Firebase access ONLY.

let app: admin.app.App;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function is safe to call multiple times.
 */
function initializeAdminApp() {
  if (!admin.apps.length) {
    try {
      // When deployed to App Hosting, service account credentials are automatically
      // configured. For local development, set up Application Default Credentials.
      // https://firebase.google.com/docs/hosting/server-side-rendering-frameworks#admin-sdk
      app = admin.initializeApp();
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  } else {
    app = admin.app();
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
  return admin.firestore(app);
}
