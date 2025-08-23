
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';

const BUCKET_NAME = 'images';

// This API route handles file uploads securely by using the user's auth token.
export async function POST(request: Request) {
    try {
        // 1. Extract the user's Authorization token from the request header.
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authorization header is missing.' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Bearer token is missing.' }, { status: 401 });
        }

        // 2. Create a temporary Supabase client authenticated with the user's token.
        // This ensures all operations are performed on behalf of the logged-in user.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` }
                }
            }
        );
        
        // 3. Verify user is authenticated.
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
             return NextResponse.json({ error: 'User authentication failed.' }, { status: 401 });
        }

        // 4. Process the uploaded file from the form data.
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        // Sanitize file name and make it unique to prevent conflicts.
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filePath = `public/${user.id}/${Date.now()}-${sanitizedFileName}`;
        
        // 5. Upload the file to Supabase Storage.
        // The RLS policy for 'insert' on storage.objects will now pass because
        // this client is authenticated as the user.
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw new Error(uploadError.message);
        }

        // 6. Get the public URL of the uploaded file to return to the client.
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
            throw new Error('Could not get public URL for the uploaded file.');
        }

        return NextResponse.json({ imageUrl: publicUrlData.publicUrl });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during file upload.';
        console.error('API Route Error:', errorMessage);
        return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
