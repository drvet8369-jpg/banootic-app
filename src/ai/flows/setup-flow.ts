'use server';
/**
 * @fileOverview A Genkit flow for setting up initial database data.
 * This should only be run once on server startup.
 */
import { defineFlow } from 'genkit/flow';
import { adminDb } from '@/lib/firebase-admin';
import { defaultProviders, defaultReviews } from '@/lib/data-seed';
import { z } from 'zod';

export const runSetup = defineFlow(
  {
    name: 'runSetup',
    inputSchema: z.void(),
    outputSchema: z.string(),
  },
  async () => {
    if (!adminDb) {
      const msg = "Firebase Admin DB is not initialized. Skipping setup.";
      console.error(msg);
      return msg;
    }
    
    // Check if a setup-flag document exists to prevent re-running.
    const setupFlagRef = adminDb.collection('internal').doc('setup-complete');
    const setupFlagDoc = await setupFlagRef.get();

    if (setupFlagDoc.exists) {
        const msg = "Initial setup has already been completed. Skipping.";
        console.log(msg);
        return msg;
    }

    console.log("Database appears to be empty. Running initial database setup...");
    const batch = adminDb.batch();

    // Add providers from the seed file
    defaultProviders.forEach((provider) => {
      // The document ID is the provider's UID (+98... format)
      const uid = `+98${provider.phone.substring(1)}`;
      const docRef = adminDb.collection('providers').doc(uid);
      batch.set(docRef, { ...provider, id: uid });
    });
    console.log(`Added ${defaultProviders.length} providers to the batch.`);

    // Add reviews from the seed file
    defaultReviews.forEach((review) => {
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const docRef = adminDb.collection('reviews').doc(reviewId); 
      const providerUid = `+98${review.providerPhone.substring(1)}`;
      batch.set(docRef, {...review, id: reviewId, providerId: providerUid });
    });
    console.log(`Added ${defaultReviews.length} reviews to the batch.`);
    
    // Set the setup-complete flag
    batch.set(setupFlagRef, { completedAt: new Date() });

    try {
      await batch.commit();
      const successMsg = "Initial database setup completed successfully!";
      console.log(successMsg);
      return successMsg;
    } catch (error) {
      const errorMsg = `Error during initial setup batch commit: ${error}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
);
