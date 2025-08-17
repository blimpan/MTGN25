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
        const [files] = await bucket.getFiles({ prefix: 'blandare/' });

        // Extract unique subfolder names with their creation times
        const folderMap = new Map();
        files.forEach(file => {
            const match = file.name.match(/^blandare\/([^/]+)\//);
            if (match && file.metadata.timeCreated) {
                const folderName = match[1];
                const creationTime = file.metadata.timeCreated;
                if (!folderMap.has(folderName) || creationTime < folderMap.get(folderName)) {
                    folderMap.set(folderName, creationTime);
                }
            }
        });

        // Sort folders by creation time (oldest first)
        const subfolders = Array.from(folderMap.entries())
            .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime())
            .map(entry => entry[0]);

        // For each subfolder, get all images and their signed URLs
        const allImages: string[][] = [];
        for (const folder of subfolders) {
            const [imageFiles] = await bucket.getFiles({ prefix: `blandare/${folder}/` });
            const imageUrls = await Promise.all(
                imageFiles
                    .filter(f => f.name.match(/\.(png|jpg|jpeg)$/i))
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                    .map(async (imgFile) => {
                        const [url] = await imgFile.getSignedUrl({
                            action: 'read',
                            expires: Date.now() + 60 * 60 * 24, // 1 day
                        });
                        return url;
                    })
            );
            if (imageUrls.length > 0) {
                allImages.push(imageUrls);
            }
        }

        return NextResponse.json(allImages);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}