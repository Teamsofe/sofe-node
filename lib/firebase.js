// lib/firebase.js - Next.js safe client initialization
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction,
  onSnapshot
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDluyTXV3W-CmkqABE3Va8Ewu_QKEdzZSM",
  authDomain: "sofe-node.firebaseapp.com",
  projectId: "sofe-node",
  storageBucket: "sofe-node.firebasestorage.app",
  messagingSenderId: "94711284647",
  appId: "1:94711284647:web:e56113d84ee550bdd02c82",
  measurementId: "G-CCPC8ZPYKK"
};

// Initialize Firebase once across SSR / client renders
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = typeof window !== 'undefined' ? getAuth(app) : null;
const db = typeof window !== 'undefined' ? getFirestore(app) : null;
const storage = typeof window !== 'undefined' ? getStorage(app) : null;
const functions = typeof window !== 'undefined' ? getFunctions(app) : null;

export const callGenkitAI = (flowName, data) => {
  if (!functions) throw new Error("Firebase functions not initialized");
  const flow = httpsCallable(functions, flowName);
  return flow(data);
};

export const callFunction = (name, data) => {
  if (!functions) throw new Error("Firebase functions not initialized");
  return httpsCallable(functions, name)(data);
};

export {
  app,
  auth,
  db,
  storage,
  functions,
  // Auth exports
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  // Firestore exports
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction,
  onSnapshot,
  // Storage exports
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  // Functions export
  httpsCallable
};
