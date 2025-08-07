import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.replace('Bearer ', '');

    // Verify token and admin status
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    const { users } = await req.json();
    if (!Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid users array.' }, { status: 400 });
    }

    const results = [];
    for (const userObj of users) {
      try {
        const { identifier, password, ...profileFields } = userObj;
        if (!identifier || !password) {
          console.log(`[bulkCreateUsers] Skipping: missing identifier or password for`, userObj);
          throw new Error('Missing identifier or password');
        }
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
          email: identifier,
          password,
        });
        console.log(`[bulkCreateUsers] Created Auth user:`, userRecord.uid, identifier);
        // Create Firestore user document
        await db.collection('users').doc(userRecord.uid).set({
          ...profileFields,
          identifier,
        });
        const docSnap = await db.collection('users').doc(userRecord.uid).get();
        if (!docSnap.exists) {
          console.log(`[bulkCreateUsers] Firestore doc missing for:`, userRecord.uid);
          throw new Error('Firestore user document not created');
        }
        console.log(`[bulkCreateUsers] Created Firestore doc for:`, userRecord.uid);
        results.push({ identifier, status: 'success', uid: userRecord.uid });
      } catch (err: any) {
        console.log(`[bulkCreateUsers] Error for`, userObj.identifier, err.message);
        results.push({ identifier: userObj.identifier, status: 'error', error: err.message });
      }
    }
    return NextResponse.json({ message: 'Bulk user creation finished.', results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
