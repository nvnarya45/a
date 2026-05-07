// Firebase Configuration
// Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBY0nqRGsqMMDFTENPoT3es5NQZpUTGRe0",
  authDomain: "energy-meter-data-37caf.firebaseapp.com",
  databaseURL: "https://energy-meter-data-37caf-default-rtdb.firebaseio.com",
  projectId: "energy-meter-data-37caf",
  storageBucket: "energy-meter-data-37caf.firebasestorage.app",
  messagingSenderId: "525817374062",
  appId: "1:525817374062:web:c815bdd169e60c1c98cd7f"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Admin email
const ADMIN_EMAIL = 'energymeter20@gmail.com';

console.log('Firebase initialized. Add your credentials in firebase-config.js to enable cloud features.');
