// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyApHLYiRPYZjyF1zP2RsPzGnz6WYqhZo5g",
  authDomain: "rental-3927f.firebaseapp.com",
  projectId: "rental-3927f",
  storageBucket: "rental-3927f.appspot.com",
  messagingSenderId: "159518880284",
  appId: "1:159518880284:web:a6e330db985608456d25d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore and Auth to use in your app
export const db = getFirestore(app);
export const auth = getAuth(app);
