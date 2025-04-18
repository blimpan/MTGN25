import admin from 'firebase-admin';

// error handling for missing environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase configuration environment variables");
}

// initialize firebase admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}


const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

// export admin.firestore and admin.auth
export { auth, db, storage };
