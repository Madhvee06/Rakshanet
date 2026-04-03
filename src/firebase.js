// ============================================================
// firebase.js – Firebase Setup for RakshaNet
// ============================================================
// This file initializes Firebase and exports:
//   - app      → the Firebase app instance
//   - db       → Firestore database (for storing/reading data)
//   - auth     → Firebase Authentication (for login/signup)
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCimgjBWNmcCfH8vE9JbIA_qga8mj4M9xU",
  authDomain: "rakshanet-2c629.firebaseapp.com",
  projectId: "rakshanet-2c629",
  storageBucket: "rakshanet-2c629.firebasestorage.app",
  messagingSenderId: "263402436861",
  appId: "1:263402436861:web:16ed8e1f07bf6797f86694",
  measurementId: "G-4JWT3V9NC9",
};

// Initialize Firebase App (only once)
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Export for use across the app
export { app, db, auth };
