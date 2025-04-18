import { NextRequest, NextResponse } from 'next/server';
import { db, auth, storage } from '../../lib/firebaseAdmin'; 
import { profile } from 'console';

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

        /* GET ALL USERS FROM USER COLLETION FROM FIREBASE */
        // get all users from the database
        const snapshot = await db.collection('users').get();
        let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        /* GET PROFILE PICTURE URLs FROM FIREBASE CLOUD STORAGE */
        // specify firebase cloud storage bucket
        const bucket = storage.bucket("mottagningen-7063b.appspot.com");
        const bucketOptions = {
            prefix: `profilepics/`,
        };
        const [profilePicsFiles] = await bucket.getFiles(bucketOptions);
        //profilePicsFiles.forEach(file => console.log(file.name));
        // Error handling if no files are found
        if (profilePicsFiles.length === 0) {
            console.error(`No files found for folder: ${bucketOptions.prefix}`);
            return NextResponse.json({ error: 'No files found for this folder' }, { status: 404 });
        };
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
        //console.log("IMAGE URLS: ", imageUrls);
        // create a map of profile IDS and corresponding picture URLs
        const profilePicMap: { [key: string]: string } = {};
        // iterate over the profile pictures and create a map of profile IDs and corresponding picture URLs
        for (let i = 1; i < profilePicsFiles.length; i++) {
            //console.log("FILENAME: ", fileNameWithExt);
            const fileName = profilePicsFiles[i].name.split('/')[1];
            //console.log("FILENAME: ", fileName);
            profilePicMap[fileName] = imageUrls[i];
        }
        //console.log("PROFILE PIC MAP: ", profilePicMap);

        // pair up the user with corresponding profilepicture URLs and add them to users array of dictonaries
        users = users.map(user => {
            const id = user.id;
            const pictureUrl = id ? profilePicMap[id] : null;
            return {
                ...user,
                profilePic: pictureUrl || '/defaultprofile.png'// replace profilePic with the URL with promise
            };
        });
        
        return NextResponse.json( users );
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}