import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let app: App;

if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 environment variable is required");
  }
  
  const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8");
  app = initializeApp({ 
    credential: cert(JSON.parse(json)),
    projectId: "bishvilam-d9380",
    storageBucket: "bishvilam-d9380.firebasestorage.app"
  });
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app).bucket();