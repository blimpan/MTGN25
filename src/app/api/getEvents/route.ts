import { NextRequest, NextResponse } from 'next/server';
import { auth, storage } from '../../lib/firebaseAdmin';

/* API for fetching event pictures */
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

        const bucket = storage.bucket("mottagningen-7063b.appspot.com");
        const options = {
            prefix: 'events/',
        };

        const [files] = await bucket.getFiles(options);

        // Collect all event subfolders from "events" folder
        const eventFolders = new Set<string>();
        files.forEach(file => {
            const pathParts = file.name.split('/');
            if (pathParts.length > 2) {
                eventFolders.add(pathParts[1]);
            }
        });

        // Generate a unique ID (can use a hash function, UUID, or base64 encoding)
        const generateUniqueId = (folderName: string): string => {
            // Simple base64 encoding for uniqueness (can be replaced with a more robust method)
            return Buffer.from(folderName).toString('base64');
        };

        // Fetch URLs for all images in each event folder and pair with unique ID
        const eventPromises = Array.from(eventFolders).map(async (eventFolder) => {
            const eventOptions = {
                prefix: `events/${eventFolder}/`,
            };

            const [eventFiles] = await bucket.getFiles(eventOptions);

            const eventImagePromises = eventFiles.map(file =>
                file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                })
            );

            const eventImageUrls = await Promise.all(eventImagePromises);
            const imageUrls = eventImageUrls.map(url => url[0]);

            return {
                id: generateUniqueId(eventFolder), // Generate and return unique ID
                event: eventFolder,
                imageUrls,
            };
        });

        const events = await Promise.all(eventPromises);

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
