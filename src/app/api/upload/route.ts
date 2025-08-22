
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';

const BUCKET_NAME = 'images';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        // Use the dedicated server client
        const supabase = createServerClient();
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const filePath = `public/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw new Error(uploadError.message);
        }

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
