import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../lib/firebaseAdmin';

/* set or remove Custom claim that a UID has admin rights */
export async function POST(req: NextRequest) {
  try {
    // Check authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!decodedToken.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { uid, isAdmin = true } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await auth.setCustomUserClaims(uid, { isAdmin });
    const action = isAdmin ? 'now an admin' : 'no longer an admin';
    return NextResponse.json({ message: `User is ${action}.` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
