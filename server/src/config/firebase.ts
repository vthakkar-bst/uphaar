import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Initialize Firebase Admin SDK
 * Note: In production, you should use environment variables or service account credentials
 */
export const setupFirebase = (): void => {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    try {
      // For local development, you can use a service account key file
      // In production, use environment variables or cloud provider's managed identity
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Initialize with service account if provided
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
      } else {
        // Initialize with application default credentials
        // This works when deployed to environments where Firebase credentials are available
        // (like Firebase hosting, Google Cloud, etc.)
        admin.initializeApp();
      }
      
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }
};

// Export Firebase services for use in other modules
export const firestore = admin.firestore;
export const auth = admin.auth;
