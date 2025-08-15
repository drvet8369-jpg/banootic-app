'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore }from "firebase/firestore";
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

// Singleton pattern to ensure only one instance of Firebase is initialized.
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else if (getApps().length) {
  app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
}

// @ts-ignore
export { app, db, auth };

// A simple getter function to ensure db is initialized before use.
// Components should use this to avoid race conditions.
export const getDb = (): Firestore => {
  if (!db) {
    // This case should ideally not happen in the client-side context
    // if the singleton pattern above works correctly.
    if (!getApps().length) {
        const newApp = initializeApp(firebaseConfig);
        db = getFirestore(newApp);
    } else {
        db = getFirestore(getApp());
    }
  }
  return db;
};
