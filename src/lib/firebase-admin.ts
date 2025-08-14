'use server';

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import "dotenv/config"

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please ensure it is in your .env.local file.');
    }
    
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('CRITICAL: Firebase admin initialization failed.', error.message);
    // Do not throw an error here, as it can crash the entire server.
    // Instead, functions that rely on adminDb or adminAuth should handle the case where they are undefined.
  }
}

// Ensure db and auth are initialized, or throw a clear error if not.
try {
    adminDb = getFirestore();
    adminAuth = getAuth();
} catch (error) {
    console.error("CRITICAL: Failed to get Firestore or Auth instance from initialized Firebase Admin app.", error);
}


export { adminDb, adminAuth };
