
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';

const getSupabaseServiceRoleClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials for service role are not available.");
    }
    
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        const supabase = getSupabaseServiceRoleClient();
        const BUCKET_NAME = 'images';
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const filePath = `public/upload-${Date.now()}-${file.name}`;
        
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
