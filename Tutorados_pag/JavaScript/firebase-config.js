import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQp2if-mGCOCHhqht23QS9vaoVFoDdKSA",
  authDomain: "pag-tutorados.firebaseapp.com",
  projectId: "pag-tutorados",
  storageBucket: "pag-tutorados.firebasestorage.app",
  messagingSenderId: "133687338700",
  appId: "1:133687338700:web:489f041b187bf1cdf0c469"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
