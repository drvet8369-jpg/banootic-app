'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function initializes and returns the Firebase app instance.
// It's safe to call this multiple times.
const getAppInstance = (): FirebaseApp => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
};

// This function initializes and returns the Firestore instance.
const getDbInstance = (): Firestore => {
  const app = getAppInstance();
  if (!db) {
    db = getFirestore(app);
    // Connect to emulator if in development and the host is available.
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === "localhost") {
       try {
        console.log("Connecting to Firestore emulator");
        connectFirestoreEmulator(db, 'localhost', 8080);
       } catch (e) {
        console.warn("Could not connect to Firestore emulator. It might not be running.", e);
       }
    }
  }
  return db;
};

// This function initializes and returns the Auth instance.
const getAuthInstance = (): Auth => {
   const app = getAppInstance();
   if (!auth) {
    auth = getAuth(app);
     if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === "localhost") {
        try {
          console.log("Connecting to Auth emulator");
          connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        } catch(e) {
          console.warn("Could not connect to Auth emulator. It might not be running.", e);
        }
    }
   }
   return auth;
};


// Export the initialized services.
const clientApp = getAppInstance();
const clientAuth = getAuthInstance();
const clientDb = getDbInstance();

export { clientApp, clientAuth, clientDb };
