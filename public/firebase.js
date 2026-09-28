// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile, reload,
         GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail,
         linkWithCredential, EmailAuthProvider,
         reauthenticateWithCredential, updatePassword }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
         collection, query, where, orderBy, limit, serverTimestamp, increment,
         writeBatch, runTransaction, onSnapshot }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDluyTXV3W-CmkqABE3Va8Ewu_QKEdzZSM",
  authDomain: "sofe-node.firebaseapp.com",
  projectId: "sofe-node",
  storageBucket: "sofe-node.firebasestorage.app",
  messagingSenderId: "94711284647",
  appId: "1:94711284647:web:e56113d84ee550bdd02c82",
  measurementId: "G-CCPC8ZPYKK"
};

// Initialize Firebase ONCE
const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);
const functions = getFunctions(app);

// AI Flow helper
export const callGenkitAI = (flowName, data) => {
    const flow = httpsCallable(functions, flowName);
    return flow(data);
};

// Helper to call any Cloud Function by name
export const callFunction = (name, data) => {
    return httpsCallable(functions, name)(data);
};

// Exporting everything
export {
  app, auth, db, storage, functions,
  // Auth — email/password
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
  sendEmailVerification, updateProfile, reload,
  // Auth — Google / OAuth
  GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail,
  linkWithCredential, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword,
  // Firestore
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, serverTimestamp,
  increment, writeBatch, runTransaction, onSnapshot,
  // Storage
  ref, uploadBytes, getDownloadURL, deleteObject,
  // Functions
  httpsCallable
};
