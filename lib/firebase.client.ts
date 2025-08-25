import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const cfg = {
  apiKey: "AIzaSyA_sxBnQcvEqBlxz3wW1tWFvj0fsA7gn10",
  authDomain: "bishvilam-d9380.firebaseapp.com",
  projectId: "bishvilam-d9380",
  storageBucket: "bishvilam-d9380.firebasestorage.app",
  messagingSenderId: "706395593469",
  appId: "1:706395593469:web:e7802836c89445604afc94",
  measurementId: "G-NX6J6QYF98"
};

const app = getApps().length ? getApps()[0] : initializeApp(cfg);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);