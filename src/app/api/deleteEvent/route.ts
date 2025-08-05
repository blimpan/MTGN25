import { NextRequest, NextResponse } from 'next/server';
import { auth, db, storage } from '../../lib/firebaseAdmin';

/* API for deleting events */
export async function DELETE(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        if (!decodedToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin using the same logic as /api/isAdmin
        const isUserAdmin = decodedToken.isAdmin === true;
        if (!isUserAdmin) {
            console.log('Admin access denied for user:', decodedToken.uid);
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        // Get the event document to retrieve the thumbnail URL
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const eventData = eventDoc.data();
        
        // Delete the thumbnail from Firebase Storage if it exists
        if (eventData?.thumbnailUrl) {
            try {
                const bucket = storage.bucket();
                const fileName = eventData.thumbnailUrl.split('/').pop()?.split('?')[0];
                if (fileName) {
                    await bucket.file(`event-thumbnails/${fileName}`).delete();
                }
            } catch (error) {
                console.warn('Error deleting thumbnail from storage:', error);
                // Continue with event deletion even if thumbnail deletion fails
            }
        }

        // Delete the event document
        await db.collection('events').doc(eventId).delete();

        return NextResponse.json({ 
            success: true, 
            message: 'Event deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
