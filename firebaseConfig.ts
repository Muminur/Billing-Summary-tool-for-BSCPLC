import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configured with the provided credentials for the 'orange-equinix' project
const firebaseConfig = {
  apiKey: "AIzaSyCu0sFTXh4XQyKnWq_XpRDoPUSPn0n5WcU",
  authDomain: "orange-equinix.firebaseapp.com",
  projectId: "orange-equinix",
  storageBucket: "orange-equinix.firebasestorage.app",
  messagingSenderId: "145329524082",
  appId: "1:145329524082:web:22a07116bb24bc505fa1eb"
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { db };