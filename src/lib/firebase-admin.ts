// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

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

} catch (error: any) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
}

export { adminApp, adminDb, adminAuth };
