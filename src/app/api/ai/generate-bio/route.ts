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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-lite' });

    const prompt = `You are an expert copywriter specializing in creating engaging and professional biographies for local service providers in Iran. Your tone should be warm, trustworthy, and professional.

    Generate a short, appealing biography (2-3 sentences) in Persian for the following provider.

    The provider's name is "${providerName}" and they specialize in "${serviceType}".

    The biography should highlight their expertise and invite customers. Do not use hashtags or emojis. Be creative and concise.`;

    // 4. Call the AI model
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // 5. Return the result
    return NextResponse.json({ biography: text });

  } catch (error: any) {
    console.error('Error calling generative AI model:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred while calling the AI service.' },
      { status: 500 }
    );
  }
}
