'use server';
/**
 * @fileOverview A Genkit flow for setting up initial database data.
 * This should only be run once.
 */
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase-admin';
import { defaultProviders, defaultReviews } from '@/lib/data-seed';
import { z } from 'zod';

export const runSetup = ai.defineFlow(
  {
    name: 'runSetup',
    inputSchema: z.void(),
    outputSchema: z.string(),
  },
  async () => {
    if (!adminDb) {
      const errorMsg = "Firebase Admin SDK not initialized. Setup cannot run.";
      console.error(errorMsg);
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
      const docRef = adminDb.collection('providers').doc(provider.phone);
      batch.set(docRef, provider);
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
