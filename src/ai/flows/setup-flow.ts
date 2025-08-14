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

    // Use a specific document as a flag to check if setup has been completed.
    const setupFlagRef = adminDb.collection('_internal').doc('setup_flag');
    const flagDoc = await setupFlagRef.get();

    if (flagDoc.exists && flagDoc.data()?.completed) {
        const msg = "Initial setup appears to be already completed (setup_flag exists and is true).";
        console.log(msg);
        return msg;
    }

    console.log("Running initial database setup...");
    const batch = adminDb.batch();

    // Add providers
    defaultProviders.forEach((provider) => {
      // The document ID will be the provider's phone number
      const docRef = adminDb.collection('providers').doc(provider.phone);
      batch.set(docRef, provider);
    });
    console.log(`Added ${defaultProviders.length} providers to the batch.`);

    // Add reviews
    defaultReviews.forEach((review) => {
      const docRef = adminDb.collection('reviews').doc(review.id);
      batch.set(docRef, review);
    });
    console.log(`Added ${defaultReviews.length} reviews to the batch.`);
    
    // Set the completion flag
    batch.set(setupFlagRef, { completed: true, timestamp: new Date() });

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
