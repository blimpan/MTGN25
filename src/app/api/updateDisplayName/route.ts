import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';


export async function POST(req: NextRequest) {
  try {
    const { uid, displayName } = await req.json();
    await admin.auth().updateUser(uid, {
      displayName,
    });

    return new NextResponse(JSON.stringify({ message: 'User updated successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error:any) {
    console.error('Error updating user:', error);
    return new NextResponse(JSON.stringify({ message: 'Error updating user', error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
