import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let _app = null;
let _db = null;

function initFirebaseAdmin() {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  // 1. Check if full service account JSON is provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const trimmed = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (trimmed.startsWith('{')) {
        const sa = JSON.parse(trimmed);
        _app = initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID || 'sofe-node',
        });
        return _app;
      } else if (trimmed.includes('BEGIN PRIVATE KEY')) {
        _app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '94711284647-compute@developer.gserviceaccount.com',
            privateKey: trimmed.replace(/\\n/g, '\n'),
          }),
          projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
        });
        return _app;
      }
    } catch (err) {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
    }
  }

  // 2. Check individual client email + private key
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      _app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
      });
      return _app;
    } catch (err) {
      console.warn('Could not initialize with client email/private key:', err.message);
    }
  }

  // 3. Fallback to default Google Cloud application credentials (standard in Cloud Functions / Cloud Run)
  try {
    _app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node',
    });
    return _app;
  } catch (err) {
    try {
      _app = initializeApp();
      return _app;
    } catch (fallbackErr) {
      console.error('CRITICAL: All Firebase Admin initialization attempts failed:', fallbackErr);
      return null;
    }
  }
}

export function getDb() {
  if (_db) return _db;
  const app = initFirebaseAdmin();
  if (app) {
    _db = getFirestore(app);
    return _db;
  }
  return getFirestore();
}

export const adminDb = new Proxy({}, {
  get(target, prop) {
    const db = getDb();
    const val = db[prop];
    if (typeof val === 'function') {
      return val.bind(db);
    }
    return val;
  }
});

export { FieldValue };
