'use client';

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// THIS FILE IS FOR CLIENT-SIDE FIREBASE ONLY

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// This flag ensures we only attempt to connect to emulators and enable persistence once.
let isFirebaseSetup = false;

if (typeof window !== 'undefined' && !isFirebaseSetup) {
    // Connect to emulators if on localhost. This must be done BEFORE any other Firestore operations.
    if (window.location.hostname === "localhost") {
        console.log("Firebase Provider: Connecting to local Firebase emulators.");
        // Use a flag on the db object to prevent multiple connections in React's strict mode.
        if (!(db as any)._settings.host) {
            connectFirestoreEmulator(db, 'localhost', 8080);
        }
    }

    // Enable offline persistence. This must be done on the client side.
    try {
        enableIndexedDbPersistence(db)
          .then(() => console.log("Firebase offline persistence enabled."))
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn("Firebase persistence failed: Can only be enabled in one tab at a time.");
            } else if (err.code === 'unimplemented') {
              console.warn("Firebase persistence is not supported in this browser.");
            }
          });
    } catch (error) {
        console.error("Error enabling Firebase offline persistence:", error);
    }
    
    isFirebaseSetup = true;
}

export { app, db, auth };