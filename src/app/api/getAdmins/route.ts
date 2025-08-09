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

        /* GET ALL USERS FROM FIREBASE AUTH */
        // Get all users from Firebase Auth with pagination
        const allAuthUsers: any[] = [];
        let nextPageToken: string | undefined;
        
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            allAuthUsers.push(...listUsersResult.users);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        // Filter admin users only
        const adminAuthUsers = allAuthUsers.filter(authUser => authUser.customClaims?.isAdmin === true);

        // Get Firestore data and profile pictures for admin users
        const adminUsers = await Promise.all(
            adminAuthUsers.map(async (authUser) => {
                let profilePicUrl = '/defaultprofile.svg';
                
                try {
                    // Get Firestore data for this user
                    const userDoc = await db.collection('users').doc(authUser.uid).get();
                    const userData = userDoc.exists ? userDoc.data() : {};
                    
                    // Get profile picture if it exists
                    if (userData?.profilePic) {
                        try {
                            // Generate signed URL for the profile picture
                            const file = storage.bucket().file(userData.profilePic.replace('gs://mottagningen-7063b.appspot.com/', ''));
                            
                            // Check if file exists before generating signed URL
                            const [exists] = await file.exists();
                            if (exists) {
                                const [url] = await file.getSignedUrl({
                                    action: 'read',
                                    expires: '03-09-2491'
                                });
                                profilePicUrl = url;
                            }
                        } catch (error) {
                            console.error(`Error getting profile picture for user ${authUser.uid}:`, error);
                        }
                    }
                    
                    return {
                        uid: authUser.uid,
                        id: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName || userData?.displayName,
                        phoneNumber: authUser.phoneNumber,
                        profilePic: profilePicUrl,
                        isAdmin: true,
                        createdAt: userData?.createdAt
                    };
                } catch (error) {
                    console.error(`Error processing user ${authUser.uid}:`, error);
                    return {
                        uid: authUser.uid,
                        id: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName,
                        phoneNumber: authUser.phoneNumber,
                        profilePic: '/defaultprofile.svg',
                        isAdmin: true
                    };
                }
            })
        );
        
        return NextResponse.json({ admins: adminUsers });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
