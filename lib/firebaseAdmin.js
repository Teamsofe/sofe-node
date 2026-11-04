import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID || 'sofe-node',
      });
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
      });
    } else {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
      });
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

export const adminDb = getFirestore();
export { FieldValue };
