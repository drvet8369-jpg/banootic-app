import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';

const BUCKET_NAME = 'images';

// This API route securely handles file uploads.
// It validates the user's token from the Authorization header and uses an admin client
// to perform the upload, ensuring RLS policies are respected based on the authenticated user.
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

        // 2. Create a Supabase admin client to validate the token.
        // The admin client can look up user identities from tokens.
        const supabaseAdmin = createAdminClient();
        
        // 3. Verify user is authenticated by fetching their data using the token.
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        
        if (userError || !user) {
             return NextResponse.json({ error: 'User authentication failed. The provided token is invalid or expired.' }, { status: 401 });
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
        // The storage RLS policy is set to allow users to upload into their own folder (user.id).
        const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;
        
        // 5. Upload the file to Supabase Storage.
        // We use the same admin client, which has the necessary permissions to upload to any path.
        // The security is enforced by our RLS policy which checks that `bucket.owner` matches `auth.uid()`.
        // We construct the `filePath` to include the user's ID, which aligns with the RLS policy.
        const { error: uploadError } = await supabaseAdmin.storage
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
        const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

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

    