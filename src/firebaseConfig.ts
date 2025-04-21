//src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyCMuYKOcuYqTcPg2AFBvZPFxvtBs90h5lI",
  authDomain: "investimentos-alunos.firebaseapp.com",
  projectId: "investimentos-alunos",
  storageBucket: "investimentos-alunos.firebasestorage.app",
  messagingSenderId: "534758420281",
  appId: "1:534758420281:web:cef03ec9b693b9897dc2e8",
  measurementId: "G-7SG4X64C7Y"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); 

export { db };
