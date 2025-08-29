
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { PortfolioItem } from '@/lib/types';

export const config = {
  api: {
    bodyParser: false, // Required for handling file streams
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'فایلی برای آپلود انتخاب نشده است.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'شناسه کاربری ارسال نشده است.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // First, get the current provider data to access the existing portfolio
    const { data: provider, error: fetchError } = await supabaseAdmin
        .from('providers')
        .select('portfolio')
        .eq('user_id', userId)
        .single();

    if (fetchError) {
        console.error('Supabase Admin Fetch Error:', fetchError);
        throw new Error('خطا در یافتن پروفایل هنرمند.');
    }
    const phoneForPath = provider.portfolio;
    // Use a different folder for portfolio items
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `portfolio-items/${userId}/${Date.now()}-${sanitizedFileName}`;

    // Upload the file to the 'images' bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, 
      });

    if (uploadError) {
      console.error('Supabase Admin Upload Error:', uploadError);
      throw new Error(`خطا در آپلود فایل به فضای ذخیره سازی: ${uploadError.message}.`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('امکان دریافت آدرس عمومی فایل وجود نداشت.');
    }
    
    // Create the new portfolio item
    const newPortfolioItem: PortfolioItem = { src: publicUrl, ai_hint: 'new work' };

    // Add the new item to the existing portfolio array
    const currentPortfolio = provider.portfolio || [];
    const updatedPortfolio = [...currentPortfolio, newPortfolioItem];

    // Update the provider's record with the new portfolio array
    const { data: updatedProvider, error: updateError } = await supabaseAdmin
      .from('providers')
      .update({ portfolio: updatedPortfolio })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase Admin DB Update Error:', updateError);
      throw new Error('خطا در به‌روزرسانی نمونه کار هنرمند.');
    }

    return NextResponse.json(updatedProvider);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'یک خطای ناشناخته در سرور رخ داد.';
    console.error('Server-side portfolio upload error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
