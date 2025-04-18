import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection } from 'firebase/firestore';
import { db, auth } from '../../lib/firebaseAdmin';
import { Post } from '../../lib/definitions';

export const dynamic = 'force-dynamic';

/* API endpoint for fetching posts */
export async function GET(req: NextRequest) {
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
        //console.log(decodedToken);
        const collectionRef = db.collection('posts');
        const snapshot = await collectionRef.get();
       
        // const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const posts: Post[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            description: doc.data().description,
            createdAt: doc.data().createdAt.toDate(), // convert Firestore Timestamp to JS Date for easier handling
          }));

        /*
        const postRef = await getDocs(collection(db, 'posts'));
        const posts = postRef.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        */        
        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
