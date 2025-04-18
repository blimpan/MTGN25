// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, Auth, browserLocalPersistence, setPersistence, EmailAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCcjn5vHPUuz7IPL6C8IH_qLBch4UyMGzQ",
    authDomain: "mottagningen-7063b.firebaseapp.com",
    databaseURL: "https://mottagningen-7063b.firebaseio.com",
    projectId: "mottagningen-7063b",
    storageBucket: "mottagningen-7063b.appspot.com",
    messagingSenderId: "427934715398",
    appId: "1:427934715398:web:99c3e22e93a964ad273d87"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth: Auth = getAuth(app);

// Set the local persistence to the browser
setPersistence(auth, browserLocalPersistence);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize EmailAuthProvider
const provider = new EmailAuthProvider();

export { db, auth, storage, provider};
