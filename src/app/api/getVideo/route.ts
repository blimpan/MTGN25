import { NextRequest, NextResponse } from 'next/server';
import { db, auth, storage } from '../../lib/firebaseAdmin'; 

/* API ENDPOINT FOR GETTING VIDEOS */
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

        /* GET ALL GOOGLE DRIVE LINKS FROM BLANDARE COLLETION FROM FIREBASE */
        const snapshot = await db.collection('video').get();
        let video = snapshot.docs.map(doc => ({ ...doc.data() }));
        
        return NextResponse.json( video );
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}