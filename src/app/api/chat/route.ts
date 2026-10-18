import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { extractTimestamps } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { api_key, message, transcript, model_name } = body;

    if (!api_key || !message) {
      return NextResponse.json({ detail: 'API kalit va savol matni talab qilinadi.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: api_key });
    const prompt = `Siz ushbu videoning shaxsiy tahlilchi yordamchisiman.
Video transkripti va xulosasi:
${transcript || 'Transkript mavjud emas'}

Qoidalar:
1. Foydalanuvchi savoliga transkript asosida aniq va lo'nda javob bering.
2. Agar aytilayotgan gap videoning qaysi vaqtiga to'g'ri kelsa, albatta [02:15] yoki [00:45] kabi bosiladigan vaqt belgilarini ko'rsating.
3. Agar so'ralgan ma'lumot videoda bo'lmasa, uni to'g'ridan-to'g'ri bildiring.

Foydalanuvchi savoli: ${message}
`;

    const response = await ai.models.generateContent({
      model: model_name || 'gemini-2.0-flash',
      contents: prompt,
    });

    const answer = response.text || '';
    const relevantTimestamps = extractTimestamps(answer);

    return NextResponse.json({
      answer,
      relevant_timestamps: relevantTimestamps,
      confidence: 0.95,
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ detail: err.message || 'Chat javob bermadi.' }, { status: 500 });
  }
}
