
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const KAVENEGAR_API_KEY = Deno.env.get('KAVENEGAR_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// تابع اشکال زدایی نهایی: این تابع تحت هیچ شرایطی نباید کرش کند.
serve(async (req: Request) => {
  const debugInfo: Record<string, any> = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {},
  };

  req.headers.forEach((value, key) => {
    // هدر حساس Authorization را برای امنیت در لاگ ثبت نمی کنیم
    if (key.toLowerCase() !== 'authorization') {
      debugInfo.headers[key] = value;
    } else {
      debugInfo.headers[key] = 'Present, but not logged for security.';
    }
  });

  try {
    // به عنوان متن خام بخوانید تا از خطای JSON جلوگیری شود
    const rawBody = await req.text();
    debugInfo.rawBody = rawBody;

    // سعی کنید آن را به عنوان JSON تجزیه کنید، اگر نشد مهم نیست
    try {
      debugInfo.parsedBody = JSON.parse(rawBody);
    } catch (e) {
      debugInfo.parsingError = `Failed to parse body as JSON: ${e.message}`;
    }
    
    // شبیه سازی تلاش برای ارسال به کاوه نگار
    const phone = debugInfo.parsedBody?.record?.phone || debugInfo.parsedBody?.phone;
    const token = debugInfo.parsedBody?.record?.otp || debugInfo.parsedBody?.otp;

    debugInfo.kavenegarAttempt = {
      attempted: true,
      hasApiKey: !!KAVENEGAR_API_KEY,
      phoneDetected: phone,
      tokenDetected: token,
      note: "This is a simulation. No actual SMS was sent in this debug mode."
    };


  } catch (err) {
    debugInfo.fatalError = `An unexpected error occurred: ${err.message}`;
    debugInfo.fatalErrorStack = err.stack;
  }

  // مهمترین بخش: همیشه یک پاسخ موفقیت آمیز 200 با تمام اطلاعات اشکال زدایی برگردانید
  // این از خطای 500 جلوگیری می کند و به ما اجازه می دهد خروجی را در کلاینت ببینیم.
  return new Response(JSON.stringify(debugInfo, null, 2), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status: 200,
  });
});
