/**
 * Script to initialize and seed the 'quiz_attempts' collection in Firestore.
 * Documents shaped: { student_id: string, topic: string, correct: boolean, created_at: timestamp }
 * 
 * Usage: node scripts/seedQuizAttempts.js
 */

const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

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
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
}

const db = getFirestore();

const DEMO_STUDENT_ID = 'demo-student';

const sampleAttempts = [
  // cryptography-and-wallets: 3 wrong, 1 correct -> top weakest
  { student_id: DEMO_STUDENT_ID, topic: 'cryptography-and-wallets', correct: false, offsetMin: 120 },
  { student_id: DEMO_STUDENT_ID, topic: 'cryptography-and-wallets', correct: false, offsetMin: 110 },
  { student_id: DEMO_STUDENT_ID, topic: 'cryptography-and-wallets', correct: false, offsetMin: 90 },
  { student_id: DEMO_STUDENT_ID, topic: 'cryptography-and-wallets', correct: true, offsetMin: 80 },

  // smart-contracts-and-evm: 2 wrong, 1 correct -> second weakest
  { student_id: DEMO_STUDENT_ID, topic: 'smart-contracts-and-evm', correct: false, offsetMin: 70 },
  { student_id: DEMO_STUDENT_ID, topic: 'smart-contracts-and-evm', correct: false, offsetMin: 60 },
  { student_id: DEMO_STUDENT_ID, topic: 'smart-contracts-and-evm', correct: true, offsetMin: 50 },

  // defi-and-token-standards: 2 wrong -> third weakest
  { student_id: DEMO_STUDENT_ID, topic: 'defi-and-token-standards', correct: false, offsetMin: 40 },
  { student_id: DEMO_STUDENT_ID, topic: 'defi-and-token-standards', correct: false, offsetMin: 30 },

  // blockchain-fundamentals: 3 correct, 0 wrong -> strong topic
  { student_id: DEMO_STUDENT_ID, topic: 'blockchain-fundamentals', correct: true, offsetMin: 20 },
  { student_id: DEMO_STUDENT_ID, topic: 'blockchain-fundamentals', correct: true, offsetMin: 15 },
  { student_id: DEMO_STUDENT_ID, topic: 'blockchain-fundamentals', correct: true, offsetMin: 10 },

  // layer-2-and-scaling: 1 correct -> strong topic
  { student_id: DEMO_STUDENT_ID, topic: 'layer-2-and-scaling', correct: true, offsetMin: 5 },
];

async function seed() {
  console.log(`Starting Firestore initialization for collection: 'quiz_attempts'...`);
  const batch = db.batch();
  const colRef = db.collection('quiz_attempts');

  const now = Date.now();

  for (const item of sampleAttempts) {
    const docRef = colRef.doc();
    const createdAt = Timestamp.fromMillis(now - item.offsetMin * 60 * 1000);
    batch.set(docRef, {
      student_id: item.student_id,
      topic: item.topic,
      correct: item.correct,
      created_at: createdAt,
    });
  }

  await batch.commit();
  console.log(`Successfully seeded ${sampleAttempts.length} sample attempts for student "${DEMO_STUDENT_ID}".`);
  console.log(`Top 3 weakest topics will resolve to:`);
  console.log(`1. cryptography-and-wallets (3 wrong)`);
  console.log(`2. smart-contracts-and-evm (2 wrong)`);
  console.log(`3. defi-and-token-standards (2 wrong)`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
