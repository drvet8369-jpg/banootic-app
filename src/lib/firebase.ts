'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// THIS FILE IS FOR CLIENT-SIDE FIREBASE ONLY

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

interface FirebaseInstances {
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
}

// A promise that resolves with the Firebase instances.
// This prevents race conditions by ensuring that Firebase is fully initialized
// before any other part of the app tries to use it.
let firebaseApp$: Promise<FirebaseInstances>;

function initializeFirebase(): Promise<FirebaseInstances> {
    return new Promise((resolve, reject) => {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            const db = getFirestore(app);
            const auth = getAuth(app);

            // This function should only be called on the client side.
            if (typeof window !== 'undefined') {
                // Connect to emulators if on localhost. This must be done BEFORE any other Firestore operations.
                if (window.location.hostname === "localhost") {
                    // Use a flag on the db object to prevent multiple connections in React's strict mode.
                    if (!(db as any)._settings.host || !((db as any)._settings.host as string).includes('localhost')) {
                         console.log("Firebase Provider: Connecting to local Firebase emulators.");
                         connectFirestoreEmulator(db, 'localhost', 8080);
                    }
                }

                // Enable offline persistence. This must be done on the client side.
                enableIndexedDbPersistence(db)
                    .then(() => {
                        console.log("Firebase offline persistence enabled.");
                        resolve({ app, db, auth });
                    })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn("Firebase persistence failed: Can only be enabled in one tab at a time.");
                        } else if (err.code === 'unimplemented') {
                            console.warn("Firebase persistence is not supported in this browser.");
                        }
                        // Still resolve, as the app can function without persistence.
                        resolve({ app, db, auth });
                    });
            } else {
                 // If not on client, resolve immediately without persistence.
                 resolve({ app, db, auth });
            }
        } catch (error) {
            console.error("CRITICAL: Firebase initialization failed.", error);
            reject(error);
        }
    });
}

// Initialize the promise. It will be resolved only once.
if (typeof window !== 'undefined') {
    firebaseApp$ = initializeFirebase();
}

// Export the promise and a function to get the instances.
// Other parts of the app will await this promise.
export { firebaseApp$ };

// Also export getter functions for convenience, though they should be used carefully.
export const getDb = async () => (await firebaseApp$).db;
export const getAuthInstance = async () => (await firebaseApp$).auth;
