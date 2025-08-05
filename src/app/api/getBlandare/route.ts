import { NextRequest, NextResponse } from 'next/server';
import { auth, storage } from '../../lib/firebaseAdmin';

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

        // Fetch all files from the 'blandare' folder in Firebase Storage
        const bucket = storage.bucket("mottagningen-7063b.appspot.com");
        const options = { prefix: 'blandare/' };
        const [files] = await bucket.getFiles(options);

        // Generate signed URLs for each file
        const fileInfos = await Promise.all(
            files
                .filter(file => file.name.endsWith('.pdf')) // Only PDFs
                .map(async (file) => {
                    const [url] = await file.getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 60 * 60 * 1000, // 1 hour
                    });
                    return url;
                })
        );
        return NextResponse.json(fileInfos);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}