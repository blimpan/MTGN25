import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../lib/firebaseAdmin';

/* API to get specific event data */
export async function GET(req: NextRequest) {
    const event = req.headers.get('Event');

    if (!event) {
        //console.error('event header missing');
        return NextResponse.json({ error: 'Event header is required' }, { status: 400 });
    }

    try {
        // specify the bucket to search for files
        const bucket = storage.bucket("mottagningen-7063b.appspot.com");
        const eventOptions = {
            prefix: `events/${event}/`,
        };

        const [eventFiles] = await bucket.getFiles(eventOptions);

        if (eventFiles.length === 0) {
            console.error(`No files found for event: ${event}`);
            return NextResponse.json({ error: 'No files found for this event' }, { status: 404 });
        }

        //console.log(`Found ${eventFiles.length} files for event: ${event}`);
        const eventImagePromises = eventFiles.map(file =>
            file.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            })
        );

        const eventImageUrls = await Promise.all(eventImagePromises);
        const imageUrls = eventImageUrls.map(url => url[0]);

        return NextResponse.json({
            event,
            imageUrls
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching event data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
