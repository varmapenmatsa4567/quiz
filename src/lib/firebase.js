import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp5k6txAg_Sv32Apft7CGFlHij2a02ijA",
  authDomain: "quiz-app-pcv.firebaseapp.com",
  projectId: "quiz-app-pcv",
  storageBucket: "quiz-app-pcv.firebasestorage.app",
  messagingSenderId: "950114218750",
  appId: "1:950114218750:web:3ee7033a9010853ee32baf",
  measurementId: "G-Q7R0S1P990"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
