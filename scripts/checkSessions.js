const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(sa), projectId: sa.project_id || 'sofe-node' });
    } else {
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'sofe-node' });
    }
  } catch (e) {
    console.error(e.message);
  }
}

const db = getFirestore();

async function check() {
  const snap = await db.collection('courses').doc('foundation').collection('sessions').get();
  console.log(`Found ${snap.docs.length} sessions in foundation course:`);
  snap.docs.forEach(doc => {
    console.log(doc.id, doc.data().title, doc.data().video_link || doc.data().video_url || doc.data().recording_link);
  });
}

check().catch(console.error);
