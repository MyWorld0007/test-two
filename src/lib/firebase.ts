// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxHgyr-w-p41_DNY_mpDQbFpCL3azyYuM",
  authDomain: "mydocula.firebaseapp.com",
  databaseURL: "https://mydocula-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mydocula",
  storageBucket: "mydocula.appspot.com",
  messagingSenderId: "319035347653",
  appId: "1:319035347653:web:d49fe21684c0cdddded6ac",
  measurementId: "G-0WZ03GE55F"
};

// Initialize Firebase for client-side, checking to prevent re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, storage, GoogleAuthProvider, createUserWithEmailAndPassword };
