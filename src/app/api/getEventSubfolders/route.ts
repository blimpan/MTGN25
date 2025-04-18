import { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, res: NextResponse) {
    try {
        const [files] = await storage.bucket("mottagningen-7063b.appspot.com").getFiles({ prefix: 'events/'});
        const subfolders = files
            .slice(1) // remove first entry (which is the folder itself)
            .filter(file => file.name.endsWith('/')) // only keep folders
            .map(file => file.name.replace('events/', '').replace('/', '')); // remove 'events/' prefix and trailing '/'
        //console.log('subfolders:', subfolders);
        return NextResponse.json(subfolders, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
