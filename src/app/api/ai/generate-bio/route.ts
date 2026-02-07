import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Check for API Key
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'API key for AI service is not configured on the server.' },
      { status: 500 }
    );
  }

  // 2. Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  
  const { providerName, serviceType } = body;

  if (!providerName || !serviceType) {
    return NextResponse.json(
      { error: 'providerName and serviceType are required.' },
      { status: 400 }
    );
  }

  // 3. Initialize Google AI and the model
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are an expert copywriter creating a biography for a local service provider in Iran.
Your task is to generate a single, clean paragraph in Persian.

**RULES:**
1.  **Output format:** The output MUST be a single block of text in Persian. Do NOT include any English words, titles (like "Option 1"), markdown, or extra explanations. The output must be ready to be displayed directly to an end-user.
2.  **Tone:** The tone should be professional yet relatable and "mainstream" (عامه پسند). Avoid overly promotional or slogan-like language. Instead of generic praise, focus on the craft and expertise.
3.  **Content:** The biography should feel authentic. Instead of just advertising, briefly mention professional details, specific skills, or the unique value the provider brings.

**Provider Details:**
-   **Name:** "${providerName}"
-   **Service:** "${serviceType}"

**Example of what to AVOID:**
- "بهترین خدمات را با ما تجربه کنید!"
- "انتخاب شماره یک شما!"

**Example of what to AIM FOR (for a baker):**
- "شیرینی‌های خانگی «شیرین‌کام» با استفاده از مواد اولیه تازه و دستورهای اصیل تهیه می‌شوند. ما در پخت کیک‌های لایه‌ای با طعم‌های خلاقانه برای مراسم شما تخصص داریم."

Generate a concise biography (2-3 sentences) based on these rules for the given provider.`;

    // 4. Call the AI model
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // 5. Return the result
    return NextResponse.json({ biography: text });

  } catch (error: any) {
    console.error('Error calling generative AI model:', error);
    if (error.message && error.message.includes('404 Not Found')) {
        return NextResponse.json(
            { error: `Error fetching from: ${error.message}` },
            { status: 500 }
        );
    }
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred while calling the AI service.' },
      { status: 500 }
    );
  }
}
