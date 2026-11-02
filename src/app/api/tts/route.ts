process.env.WS_NO_BUFFER_UTIL = '1';

import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mapping of languages and voices to Microsoft Edge Neural voices
const VOICE_MAP: Record<string, { female: string; male: string }> = {
  uz: {
    female: 'uz-UZ-MadinaNeural',
    male: 'uz-UZ-SardorNeural',
  },
  ru: {
    female: 'ru-RU-SvetlanaNeural',
    male: 'ru-RU-DmitryNeural',
  },
  en: {
    female: 'en-US-JennyNeural',
    male: 'en-US-GuyNeural',
  },
};

// In-memory LRU-like cache for generated audio chunks (max 100 items)
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(text: string, voice: string, rate: string): string {
  return `${voice}_${rate}_${text.trim()}`;
}

/**
 * Intelligent language detection to guarantee the neural voice matches the text
 * and prevents foreign/robotic accents (e.g. Russian voice reading Uzbek words).
 */
function resolveOptimalVoice(text: string, requestedLang: string, gender: 'female' | 'male'): string {
  const clean = text.trim();

  // 1. Detect Cyrillic characters (Russian)
  const cyrillicMatches = clean.match(/[\u0400-\u04FF]/g) || [];
  const isCyrillic = cyrillicMatches.length > Math.max(3, clean.length * 0.2);

  // 2. Detect Uzbek linguistic markers
  const uzbekPattern = /[oOgG]['`ʻ’]|\b(va|uchun|bilan|haqida|ham|faqat|bu|shu|sizlar|bizlar|kerak|emas|noutbuk|kompyuter|qilish|qilamiz|bo'lib|bo'lgan|yoki|o'zbek|salom|assalomu|do'stlar|obzor|gap|so'z|yaxshi)\b/i;
  const isUzbek = uzbekPattern.test(clean);

  let lang = (requestedLang || 'uz').toLowerCase();

  // Auto-correct language mismatch to ensure 100% natural speech
  if (isCyrillic) {
    lang = 'ru';
  } else if (isUzbek) {
    lang = 'uz';
  }

  const voiceMap = VOICE_MAP[lang] || VOICE_MAP['uz'];
  return gender === 'male' ? voiceMap.male : voiceMap.female;
}

/**
 * Clean and format text for Azure Neural Speech
 */
function sanitizeTextForTts(text: string): string {
  return text
    .replace(/[«»]/g, '"')
    .replace(/[–—]/g, '-')
    // Normalize Uzbek special letters o', g' with standard apostrophe so TTS reads smoothly
    .replace(/([ogOG])[`ʻ’]/g, "$1'")
    .trim()
    .slice(0, 1000);
}

async function synthesizeWithEdge(text: string, voiceName: string, rate: string = '+0%'): Promise<Buffer> {
  const cleanText = sanitizeTextForTts(text);
  const cacheKey = getCacheKey(cleanText, voiceName, rate);
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(cleanText, { rate });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try { tts.close(); } catch (_) {}
      reject(new Error('TTS generation timed out'));
    }, 12000);

    audioStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on('end', () => {
      clearTimeout(timeout);
      try { tts.close(); } catch (_) {}
      const fullBuffer = Buffer.concat(chunks);

      if (audioCache.size >= MAX_CACHE_SIZE) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, fullBuffer);

      resolve(fullBuffer);
    });

    audioStream.on('error', (err) => {
      clearTimeout(timeout);
      try { tts.close(); } catch (_) {}
      reject(err);
    });
  });
}

// Fallback using Google Translate TTS if Edge TTS encounters network blocks
async function fallbackGoogleTranslate(text: string, lang: string): Promise<Buffer | null> {
  try {
    const targetLang = lang === 'uz' ? 'uz' : lang === 'ru' ? 'ru' : 'en';
    const encoded = encodeURIComponent(text.trim().slice(0, 200));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=${targetLang}&q=${encoded}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.warn('[TTS] Google fallback failed:', e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  const lang = (searchParams.get('lang') || 'uz').toLowerCase();
  const gender = (searchParams.get('gender') || 'female').toLowerCase() as 'female' | 'male';
  const customVoice = searchParams.get('voice');
  const rate = searchParams.get('rate') || '+0%';

  if (!text.trim()) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  const voiceName = customVoice || resolveOptimalVoice(text, lang, gender);

  try {
    const audioBuffer = await synthesizeWithEdge(text, voiceName, rate);
    return new Response(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    });
  } catch (err: any) {
    console.warn(`[TTS] Edge TTS error for "${text.slice(0, 30)}...":`, err?.message || err);

    // Fallback to Google Translate TTS
    const fallbackBuffer = await fallbackGoogleTranslate(text, lang);
    if (fallbackBuffer) {
      return new Response(new Uint8Array(fallbackBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': fallbackBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return NextResponse.json(
      { error: 'TTS audio synthesis failed', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang = 'uz', gender = 'female', voice, rate = '+0%' } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const voiceName = voice || resolveOptimalVoice(text, lang, gender);
    const audioBuffer = await synthesizeWithEdge(text, voiceName, rate);
    return new Response(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    });
  } catch (err: any) {
    console.error('[TTS POST] Error:', err);
    return NextResponse.json(
      { error: 'TTS generation failed', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
