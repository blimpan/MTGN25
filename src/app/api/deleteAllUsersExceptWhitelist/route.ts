import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { auth } from '../../lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';

// Only allow these UIDs to remain
const WHITELIST = [
  'OuNkeG1c6wfBbqwo307NboyTHkS2', // test user
  'DWsI9YHXFSccP6QrgWfj6tHq9oG3', // admin user
  'NUxZEeUgN3ULZunpLqcHJjF2pop2', // Loke
];

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

export async function POST(req: NextRequest) {
    // Check admin status
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    // extract the user from the auth token
    const idToken = authHeader.split('Bearer ')[1];

    const decodedToken = await auth.verifyIdToken(idToken);
    // check if the user has the custom claim isAdmin
    const isAdmin = decodedToken.isAdmin || false; // defaults to false if isAdmin isnt found
        
    if (!isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    // List all users
    let allUsers: any[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
        const result = await getAuth().listUsers(1000, nextPageToken);
        allUsers = allUsers.concat(result.users);
        nextPageToken = result.pageToken;
    } while (nextPageToken);

    const toDelete = allUsers.filter(u => !WHITELIST.includes(u.uid));
    const kept = allUsers.filter(u => WHITELIST.includes(u.uid));

    // Delete users, firestore docs, and storage files
    const firestore = getFirestore();
    const storage = getStorage();
    let deletedCount = 0;
    for (const user of toDelete) {
    try {
        await getAuth().deleteUser(user.uid);
    } catch {}
    try {
        await firestore.collection('users').doc(user.uid).delete();
    } catch {}
    try {
        await storage.bucket().file(`profilepics/${user.uid}`).delete({ ignoreNotFound: true });
    } catch {}
    deletedCount++;
    }

    return NextResponse.json({
    deletedCount,
    keptCount: kept.length,
    deletedUids: toDelete.map(u => u.uid),
    keptUids: kept.map(u => u.uid),
    });
    }
