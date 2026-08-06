// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Database aur offline mode ke liye
import { getAuth } from "firebase/auth"; // Login/Auth ke liye

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjmAHxhhEmIfpmMC-glskeSHNXuVXXlBU",
  authDomain: "mediveuerp.firebaseapp.com",
  projectId: "mediveuerp",
  storageBucket: "mediveuerp.firebasestorage.app",
  messagingSenderId: "203997741439",
  appId: "1:203997741439:web:a44659832e6a107d80da4a"
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
