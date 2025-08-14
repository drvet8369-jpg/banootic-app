// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// This module ensures that Firebase Admin is initialized only once.
// It provides a single point of access to the admin app, db, and auth instances.

let adminApp: admin.app.App;
let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

try {
  if (!admin.apps.length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error(
        'CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server-side features will be unavailable.'
      );
    }

    // Decode the Base64 string and then parse it as a JSON object
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountKey, 'base64').toString('utf8')
    );

    console.log('Initializing Firebase Admin SDK...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  }

  adminApp = admin.app();
  adminDb = admin.firestore();
  adminAuth = admin.auth();

} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // Re-throw the error to make it clear that the server cannot start properly.
  // This prevents the app from running in a broken state.
  throw new Error(`Firebase Admin SDK initialization failed: ${error}`);
}

export { adminApp, adminDb, adminAuth };
