import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { extractTimestamps } from '@/lib/gemini';
import { fetchYouTubeVideoDetails } from '@/lib/youtube';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { api_key, message, transcript, model_name, video_url } = body;

    if (!api_key || !message) {
      return NextResponse.json({ detail: 'API kalit va savol matni talab qilinadi.' }, { status: 400 });
    }

    let extraContext = '';
    if (video_url) {
      try {
        const details = await fetchYouTubeVideoDetails(video_url);
        extraContext = `
Video nomi: "${details.title}"
Kanal: ${details.author}
Video tavsifi: ${details.description.slice(0, 1500)}
${details.hasTranscript ? `Video transkripti:\n${details.transcript.slice(0, 15000)}` : ''}
`;
      } catch (e) {
        // ignore
      }
    }

    const ai = new GoogleGenAI({ apiKey: api_key });
    const prompt = `Siz ushbu videoning shaxsiy tahlilchi yordamchisisiz.
${extraContext}

Foydalanuvchiga taqdim etilgan tahlil xulosasi:
${transcript || 'Transkript mavjud emas'}

Qoidalar:
1. Foydalanuvchi savoliga AYNAN USHBU VIDEO mazmuni asosida aniq va lo'nda javob bering. Begona yoki xayoliy narsalarni qo'shmang.
2. Agar aytilayotgan gap videoning qaysi vaqtiga to'g'ri kelsa, albatta [02:15] yoki [00:45] kabi bosiladigan vaqt belgilarini ko'rsating.
3. Agar so'ralgan ma'lumot videoda bo'lmasa, uni to'g'ridan-to'g'ri bildiring.

Foydalanuvchi savoli: ${message}
`;

    const response = await ai.models.generateContent({
      model: model_name || 'gemini-2.5-flash',
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
