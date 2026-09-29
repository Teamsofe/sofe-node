import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDluyTXV3W-CmkqABE3Va8Ewu_QKEdzZSM",
  authDomain: "sofe-node.firebaseapp.com",
  projectId: "sofe-node",
  storageBucket: "sofe-node.firebasestorage.app",
  messagingSenderId: "94711284647",
  appId: "1:94711284647:web:e56113d84ee550bdd02c82",
  measurementId: "G-CCPC8ZPYKK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = 'admin@sofenode.com';
const adminPassword = 'password123';

async function main() {
  let user;
  try {
    console.log(`Checking existing account: ${adminEmail}...`);
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    user = cred.user;
    console.log(`Signed in successfully! UID: ${user.uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        console.log(`Creating Firebase Auth user: ${adminEmail}...`);
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        user = cred.user;
        console.log(`Created user successfully! UID: ${user.uid}`);
      } catch (createErr) {
        console.error('Failed to create user:', createErr);
        process.exit(1);
      }
    } else {
      console.error('Sign-in error:', err);
      process.exit(1);
    }
  }

  if (user) {
    console.log(`Updating Firestore users/${user.uid} with super_admin privileges...`);
    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'admin',
      admin_role: 'super_admin',
      account_type: 'admin',
      is_premium: true,
      foundation_complete: true,
      can_post_bounties: true,
      wallet_balance: 10000000,
      xp_total: 50000,
      daily_streak: 60,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }, { merge: true });

    console.log(`=== SUPER ADMIN SETUP COMPLETE ===`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: admin`);
    console.log(`Admin Role: super_admin`);
    console.log(`Console: /admin-dashboard or /admin`);
  }
}

main().catch(console.error);
