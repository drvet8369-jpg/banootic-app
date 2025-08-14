'use server';
/**
 * @fileOverview A Genkit flow for setting up initial database data.
 * This should only be run once on server startup.
 */
import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase-admin'; // Use the robust admin module
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
      const msg = "Firebase Admin DB is not initialized. Skipping setup.";
      console.error(msg);
      return msg;
    }
    
    // Check if the providers collection is empty as a flag to run setup.
    const providersCollection = adminDb.collection('providers');
    const providersSnapshot = await providersCollection.limit(1).get();

    if (!providersSnapshot.empty) {
        const msg = "Initial setup appears to be already completed (providers collection is not empty). Skipping.";
        console.log(msg);
        return msg;
    }

    console.log("Database is empty. Running initial database setup...");
    const batch = adminDb.batch();

    // Add providers from the seed file
    defaultProviders.forEach((provider) => {
      // The document ID is the provider's phone number
      const docRef = adminDb.collection('providers').doc(provider.phone);
      // Also save the phone number as the 'id' field inside the document
      batch.set(docRef, { ...provider, id: provider.phone });
    });
    console.log(`Added ${defaultProviders.length} providers to the batch.`);

    // Add reviews from the seed file
    defaultReviews.forEach((review) => {
      // Auto-generate a document ID for each review
      const docRef = adminDb.collection('reviews').doc(); 
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
      // Throwing the error here will make it more visible in logs
      throw new Error(errorMsg);
    }
  }
);
