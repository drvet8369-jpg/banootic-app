
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const config = {
  api: {
    bodyParser: false, // Disabling body parser to handle file streams
  },
};

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. Authenticate the user from the token sent in the headers
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication failed: ' + (authError?.message || 'No user session found') }, { status: 401 });
  }

  // 2. Get the file from the request body
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    // 3. Use the powerful ADMIN client to perform the upload and database update
    const supabaseAdmin = createAdminClient();
    const userId = user.id;
    const providerPhone = user.user_metadata.phone;

    // Sanitize file name and create a unique path
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const filePath = `profile-images/${userId}/${Date.now()}-${sanitizedFileName}`;

    // Upload the file to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      throw new Error('Failed to upload file to storage.');
    }

    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Could not get public URL for the uploaded file.');
    }
    
    const newProfileImage = { src: publicUrl, ai_hint: 'woman portrait' };

    // 4. Update the provider's record in the database
    const { data: updatedProvider, error: updateError } = await supabaseAdmin
        .from('providers')
        .update({ profile_image: newProfileImage })
        .eq('phone', providerPhone)
        .select()
        .single();
    
    if (updateError) {
      console.error('Database Update Error:', updateError);
      throw new Error('Failed to update provider profile.');
    }

    // 5. Return the updated provider data to the client
    return NextResponse.json(updatedProvider);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Server-side upload error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
