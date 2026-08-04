// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Offline function add kiya
import { getAuth } from "firebase/auth"; // Login ke liye

// Your web app's Firebase configuration using Vite Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// App ke baaki hisso mein use karne ke liye inko export karein
export const db = getFirestore(app);
export const auth = getAuth(app);

// Database ko offline enable karne ka setup
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Offline database enable ho gaya!");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log("Agar multiple tabs open hain, toh offline mode sirf ek mein chalega.");
    } else if (err.code === 'unimplemented') {
      console.log("Browser offline mode support nahi karta.");
    }
  });
