
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const config = {
  api: {
    bodyParser: false, // Required for handling file streams
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const phone = formData.get('phone') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'فایلی برای آپلود انتخاب نشده است.' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'شناسه کاربری (شماره تلفن) ارسال نشده است.' }, { status: 400 });
    }

    // Use the admin client with the service_role key for elevated privileges
    const supabaseAdmin = createAdminClient();

    // Create a unique, user-specific path for the file
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `profile-images/${phone}/${Date.now()}-${sanitizedFileName}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite file if it exists, useful for re-uploads
      });

    if (uploadError) {
      console.error('Supabase Admin Upload Error:', uploadError);
      throw new Error('خطا در آپلود فایل به فضای ذخیره‌سازی.');
    }

    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('امکان دریافت آدرس عمومی فایل وجود نداشت.');
    }
    
    // Prepare the JSON object for the profile_image column
    const newProfileImage = { src: publicUrl, ai_hint: 'woman portrait' };

    // Update the provider's record in the database
    const { data: updatedProvider, error: updateError } = await supabaseAdmin
      .from('providers')
      .update({ profile_image: newProfileImage })
      .eq('phone', phone)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase Admin DB Update Error:', updateError);
      throw new Error('خطا در به‌روزرسانی پروفایل هنرمند.');
    }

    // Return the successfully updated provider data
    return NextResponse.json(updatedProvider);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد.';
    console.error('Server-side upload processing error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
