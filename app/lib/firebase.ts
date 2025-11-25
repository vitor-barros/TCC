// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfb0FGuaBo9vJAv5YytuOelLtaYmT98Bk",
  authDomain: "tccfinal-1ccff.firebaseapp.com",
  databaseURL: "https://tccfinal-1ccff-default-rtdb.firebaseio.com",
  projectId: "tccfinal-1ccff",
  storageBucket: "tccfinal-1ccff.firebasestorage.app",
  messagingSenderId: "347429525924",
  appId: "1:347429525924:web:ac6d2bf1c6b1db47b74931",
  measurementId: "G-T0VMPRMM3M"
};

// Singleton para evitar recriar app no hot-reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);
// const analytics = getAnalytics(app);


export { db, auth };

