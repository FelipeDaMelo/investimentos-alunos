// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMuYKOcuYqTcPg2AFBvZPFxvtBs90h5lI",
  authDomain: "investimentos-alunos.firebaseapp.com",
  projectId: "investimentos-alunos",
  storageBucket: "investimentos-alunos.firebasestorage.app",
  messagingSenderId: "534758420281",
  appId: "1:534758420281:web:cef03ec9b693b9897dc2e8",
  measurementId: "G-7SG4X64C7Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);