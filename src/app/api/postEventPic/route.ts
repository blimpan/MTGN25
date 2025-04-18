import { NextRequest, NextResponse } from 'next/server';
import { auth, storage } from '../../lib/firebaseAdmin';

export async function POST(req: NextRequest) {
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

    // Parse form data
    const formData = await req.formData();
    const subfolder = formData.get('subfolder') as string;

    if (!subfolder) {
      return NextResponse.json({ error: 'Subfolder is required' }, { status: 400 });
    }

    const filePromises: Promise<void>[] = [];

    // Iterate through the files in formData
    formData.forEach((value, key) => {
      if (key === 'image' && value instanceof File) {
        const file = value;

        // Handle the file as a promise
        const uploadPromise = file.arrayBuffer().then(async (arrayBuffer) => {
          const buffer = Buffer.from(arrayBuffer);

          // Create a reference to the file in Firebase Storage
          const bucket = storage.bucket("mottagningen-7063b.appspot.com");
          const fileRef = bucket.file(`events/${subfolder}/${file.name}`);

          // Upload the file to Firebase Storage
          await fileRef.save(buffer, {
            metadata: {
              contentType: file.type,
            },
          });
        });

        filePromises.push(uploadPromise);
      }
    });

    // Wait for all file uploads to complete
    await Promise.all(filePromises);

    return NextResponse.json({ message: 'Images uploaded successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}
