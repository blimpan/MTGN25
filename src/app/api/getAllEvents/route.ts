import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../lib/firebaseAdmin';

/* API for fetching all events from Firestore */
export async function GET(req: NextRequest) {
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

        // Fetch all events from Firestore
        const eventsSnapshot = await db.collection('events').get();

        const events = eventsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore timestamps to ISO strings for JSON serialization
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                eventDate: data.eventDate?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || null
            };
        });

        // Sort by eventDate (newest first)
        const sortedEvents = events.sort((a, b) => {
            const dateA = new Date(a.eventDate || a.createdAt || 0);
            const dateB = new Date(b.eventDate || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        return NextResponse.json({ events: sortedEvents });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
