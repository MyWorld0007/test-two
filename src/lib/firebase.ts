// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDxHgyr-w-p41_DNY_mpDQbFpCL3azyYuM",
  authDomain: "mydocula.firebaseapp.com",
  databaseURL: "https://mydocula-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mydocula",
  storageBucket: "mydocula.firebasestorage.app",
  messagingSenderId: "319035347653",
  appId: "1:319035347653:web:d49fe21684c0cdddded6ac",
  measurementId: "G-0WZ03GE55F"
};

// Initialize Firebase for client-side, checking to prevent re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, GoogleAuthProvider, createUserWithEmailAndPassword };
