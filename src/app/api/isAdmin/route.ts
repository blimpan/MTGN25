import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../lib/firebaseAdmin'; // Ensure this path is correct
import "../../lib/firebaseConfig"; // Ensure this path is correct

/* API endpoint for checking custom admin claim */
/* MOSTLY USED TO RESTRICT ACCESS FOR N0LLAN */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  // extract the user from the auth token
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    // check if the user has the custom claim isAdmin
    const isAdmin = decodedToken.isAdmin || false; // defaults to false if isAdmin isnt found
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
