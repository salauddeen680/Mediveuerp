// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Database ke liye
import { getAuth } from "firebase/auth"; // Login ke liye

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

