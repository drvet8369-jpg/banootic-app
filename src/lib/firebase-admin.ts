import admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | undefined;

function initializeAdminApp() {
  // Check if the app is already initialized to prevent errors.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // When deployed to App Hosting, service account credentials are automatically
  // configured. For local development, set up Application Default Credentials.
  // https://firebase.google.com/docs/hosting/server-side-rendering-frameworks#admin-sdk
  return admin.initializeApp();
}

/**
 * Gets the server-side Firestore database instance.
 * Initializes the Firebase Admin SDK if not already done.
 */
export function getAdminDb(): admin.firestore.Firestore {
  if (!adminDb) {
    const app = initializeAdminApp();
    adminDb = admin.firestore(app);
  }
  return adminDb;
}
