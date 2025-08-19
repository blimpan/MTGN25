import { NextRequest, NextResponse } from 'next/server';
import { auth, storage } from '../../lib/firebaseAdmin';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const userRecord = await auth.getUser(decodedToken.uid);
    if (!userRecord.customClaims?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { folderName } = await request.json();
    
    if (!folderName) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const bucket = storage.bucket();
    const folderPath = `blandare/${folderName}/`;

    // List all files in the folder (including metadata)
    const [files] = await bucket.getFiles({
      prefix: folderPath,
    });

    // Delete all files in the folder (including metadata.json)
    if (files.length > 0) {
      await Promise.all(files.map((file: any) => file.delete()));
    }

    return NextResponse.json({ 
      success: true, 
      message: `Bländare "${folderName}" deleted successfully`,
      deletedFiles: files.length
    });

  } catch (error) {
    console.error('Error deleting bländare:', error);
    return NextResponse.json(
      { error: 'Failed to delete bländare' },
      { status: 500 }
    );
  }
}
