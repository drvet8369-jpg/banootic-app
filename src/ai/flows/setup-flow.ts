'use server';
/**
 * @fileOverview A Genkit flow for setting up initial database data.
 * This should only be run once.
 */
import { ai } from '@/ai/genkit';
import { defaultProviders, defaultReviews } from '@/lib/data-seed';
import { z } from 'zod';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error: any) {
  console.error('CRITICAL: Firebase admin initialization failed in setup flow.', error);
}

export const runSetup = ai.defineFlow(
  {
    name: 'runSetup',
    inputSchema: z.void(),
    outputSchema: z.string(),
  },
  async () => {
    let adminDb;
    try {
        adminDb = getFirestore();
    } catch (e) {
        const errorMsg = "Firebase Admin SDK not initialized properly. Setup cannot run.";
        console.error(errorMsg, e);
        return errorMsg;
    }

    // Check if the providers collection is empty as a flag
    const providersCollection = adminDb.collection('providers');
    const providersSnapshot = await providersCollection.limit(1).get();

    if (!providersSnapshot.empty) {
        const msg = "Initial setup appears to be already completed (providers collection is not empty).";
        console.log(msg);
        return msg;
    }

    console.log("Running initial database setup...");
    const batch = adminDb.batch();

    // Add providers
    defaultProviders.forEach((provider) => {
      // Use the phone number as the document ID
      const docRef = adminDb.collection('providers').doc(provider.phone);
      // Add the ID to the document data itself
      batch.set(docRef, { ...provider, id: provider.phone });
    });
    console.log(`Added ${defaultProviders.length} providers to the batch.`);

    // Add reviews
    defaultReviews.forEach((review) => {
      const docRef = adminDb.collection('reviews').doc(); // Auto-generate ID
      batch.set(docRef, {...review, id: docRef.id});
    });
    console.log(`Added ${defaultReviews.length} reviews to the batch.`);
    

    try {
      await batch.commit();
      const successMsg = "Initial database setup completed successfully!";
      console.log(successMsg);
      return successMsg;
    } catch (error) {
      const errorMsg = `Error during initial setup batch commit: ${error}`;
      console.error(errorMsg);
      return errorMsg;
    }
  }
);
