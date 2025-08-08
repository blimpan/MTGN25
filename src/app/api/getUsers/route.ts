import { NextRequest, NextResponse } from 'next/server';
import { db, auth, storage } from '../../lib/firebaseAdmin';

export async function GET(req: NextRequest, res: NextResponse) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    // extract the user from the auth token
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        // if the token is invalid, return an Unauthorized response
        if (!decodedToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        if (!decodedToken.isAdmin) {
            return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
        }

        /* GET ALL USERS FROM FIREBASE AUTH AND MERGE WITH FIRESTORE DATA */
        // First, get all users from Firebase Auth
        const allAuthUsers: any[] = [];
        let nextPageToken: string | undefined;
        
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            allAuthUsers.push(...listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        // Get all users from Firestore
        const snapshot = await db.collection('users').get();
        const firestoreUsers = new Map();
        snapshot.docs.forEach(doc => {
            firestoreUsers.set(doc.id, { id: doc.id, uid: doc.id, ...doc.data() });
        });

        /* GET PROFILE PICTURE URLs FROM FIREBASE CLOUD STORAGE */
        // specify firebase cloud storage bucket
        const bucket = storage.bucket("mottagningen-7063b.appspot.com");
        const bucketOptions = {
            prefix: `profilepics/`,
        };
        const [profilePicsFiles] = await bucket.getFiles(bucketOptions);
        
        // Create profile picture map (handle case where no files exist)
        const profilePicMap: { [key: string]: string } = {};
        if (profilePicsFiles.length > 0) {
            // get signed URLs for the images (otherwise they are private) and remove the first entry (the folder itself)
            const eventImagePromises = profilePicsFiles.map(file =>
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                })
            );

            // get the URLs with the signed URLs
            const eventImageUrls = await Promise.all(eventImagePromises);
            const imageUrls = eventImageUrls.map(url => url[0]);
            
            // iterate over the profile pictures and create a map of profile IDs and corresponding picture URLs
            for (let i = 1; i < profilePicsFiles.length; i++) {
                const fileName = profilePicsFiles[i].name.split('/')[1];
                profilePicMap[fileName] = imageUrls[i];
            }
        }

        // Merge Firebase Auth users with Firestore data
        const usersWithAdminStatus = allAuthUsers.map((authUser) => {
            const firestoreData = firestoreUsers.get(authUser.uid) || {};
            const isAdmin = authUser.customClaims?.isAdmin || false;
            const pictureUrl = profilePicMap[authUser.uid + '.webp'];
            
            return {
                uid: authUser.uid,
                id: authUser.uid,
                ...firestoreData, // Include any additional Firestore data first
                // Then override with Firebase Auth data which is more reliable
                email: authUser.email || firestoreData.email || firestoreData.identifier,
                displayName: authUser.displayName || firestoreData.displayName || firestoreData.name,
                username: firestoreData.username || firestoreData.name || authUser.displayName,
                phoneNumber: authUser.phoneNumber || firestoreData.phoneNumber,
                createdAt: firestoreData.createdAt,
                profilePic: pictureUrl || '/defaultprofile.svg',
                isAdmin
            };
        });
        
        return NextResponse.json({ users: usersWithAdminStatus });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}