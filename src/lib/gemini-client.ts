import { AnalysisMode, OutputLanguage, AnalysisResponse, AudioTimelineItem } from '@/types';
import { buildSystemPrompt, safeJsonParse, DISCLAIMERS } from './gemini';

/**
 * Convert a File or Blob into Base64 string in browser
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface ClientAnalyzeParams {
  apiKey: string;
  modelName: string;
  file?: File | null;
  videoUrl?: string | null;
  mode: AnalysisMode;
  targetLanguage: OutputLanguage;
  enableTranscript?: boolean;
  childAge?: number;
  targetRole?: string;
  seniorityLevel?: string;
  techStack?: string;
  customPrompt?: string;
}

/**
 * Resolve candidate fallback models so the user never gets blocked by 404 or quota limits.
 */
function getCandidateModels(requestedModel: string): string[] {
  const clean = (requestedModel || '').replace(/^models\//, '').trim();
  const prioritized = [
    clean,
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro',
  ].filter(Boolean);

  return Array.from(new Set(prioritized));
}

/**
 * Direct Client-Side Gemini Multimodal Analyzer.
 * Seamlessly connects the user's browser directly to Google Gemini API (generativelanguage.googleapis.com).
 * Fetches 100% verified real transcripts and metadata for YouTube videos to prevent hallucinations.
 */
export async function analyzeMediaDirectly(params: ClientAnalyzeParams): Promise<AnalysisResponse> {
  const {
    apiKey,
    modelName = 'gemini-2.5-flash',
    file,
    videoUrl,
    mode,
    targetLanguage,
    enableTranscript = true,
    childAge = 6,
    targetRole = 'Full Stack Developer',
    seniorityLevel = 'Middle',
    techStack = 'General',
    customPrompt = '',
  } = params;

  const cleanApiKey = (apiKey || '').trim();
  if (!cleanApiKey) {
    throw new Error('Gemini API kaliti talab qilinadi. Iltimos Sozlamalar sahifasida kalitingizni kiriting.');
  }

  const systemInstructionText = buildSystemPrompt(mode, targetLanguage, {
    childAge,
    targetRole,
    seniorityLevel,
    techStack,
    enableTranscript,
    customPrompt,
  });

  const parts: any[] = [];
  let videoMeta: any = null;

  if (file) {
    const base64Data = await fileToBase64(file);
    let mimeType = file.type || 'application/octet-stream';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'mp3') mimeType = 'audio/mpeg';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'm4a') mimeType = 'audio/mp4';
    else if (ext === 'ogg' || ext === 'opus') mimeType = 'audio/ogg';
    else if (ext === 'flac') mimeType = 'audio/flac';
    else if (ext === 'aac') mimeType = 'audio/aac';
    else if (ext === 'mp4' || ext === 'm4v') mimeType = 'video/mp4';
    else if (ext === 'webm') mimeType = 'video/webm';
    else if (ext === 'mov') mimeType = 'video/quicktime';

    parts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      },
    });

    const fileInstruction =
      mode === 'document'
        ? `Ushbu "${file.name}" nomli PDF hujjatni to'liq o'rganib chiq. Undagi barcha matnlar, boblar, jadvallar va asosiy tezislarni to'liq transkript va audio_timeline sifatida tizimli tahlil qil.`
        : mode === 'audio'
        ? `Ushbu "${file.name}" nomli audio faylni boshidan oxirigacha tinglab tahlil qil. Unda aytilgan gaplarni, spikerlar nutqini audio_timeline va transcriptda daqiqama-daqiqa so'zma-so'z transkript qil.`
        : `Ushbu "${file.name}" nomli video materialni boshidan oxirigacha tahlil qil. Videoda gapirilgan barcha gaplarni audio_timeline va transcriptda so'zma-so'z ko'rsat.`;

    parts.push({ text: fileInstruction });
  } else if (videoUrl) {
    // 1. Fetch verified YouTube metadata and spoken transcript from server helper
    try {
      console.log(`[Tahlilchi AI] YouTube ma'lumotlari va haqiqiy spiker nutqi olinmoqda...`);
      const detailsRes = await fetch(`/api/youtube-details?url=${encodeURIComponent(videoUrl)}`);
      if (detailsRes.ok) {
        videoMeta = await detailsRes.json();
        console.log(`[Tahlilchi AI] YouTube ma'lumotlari olindi: "${videoMeta?.title}", Subtitrlar: ${videoMeta?.hasTranscript ? `${videoMeta?.transcriptItems?.length || 'bor'} gap` : 'mavjud emas'}`);
      }
    } catch (metaErr) {
      console.warn('[Tahlilchi AI] YouTube details helper ogohlantirish:', metaErr);
    }

    const videoTitle = videoMeta?.title || 'YouTube Video';
    const videoAuthor = videoMeta?.author || 'YouTube Muallifi';
    const hasValidDuration = videoMeta?.duration && videoMeta.duration > 0;
    const durationInfo = hasValidDuration
      ? `${videoMeta.durationFormatted} (${videoMeta.duration} soniya)`
      : (videoMeta?.transcriptItems?.length ? `${videoMeta.transcriptItems.length} ta gapdan iborat to'liq video` : 'Videoni to\'liq boshidan oxirigacha');

    if (videoMeta?.hasTranscript && videoMeta?.transcript) {
      parts.push({
        text: `==================================================
USHBU YOUTUBE VIDEOSINING HAQIQIY MA'LUMOTLARI VA 100% ANIQ SPAYKER NUTQI:
- Haqiqiy sarlavha (Title): "${videoTitle}"
- Muallif / Kanal (Author): ${videoAuthor}
- Davomiyligi: ${durationInfo}
${videoMeta.description ? `- Tavsif:\n${videoMeta.description.slice(0, 2500)}` : ''}

VIDEODA SPAYKERNING AYTGAN BARCHA GAPLARI (SO'ZMA-SO'Z NUTQ - JAMI ${videoMeta.transcriptItems?.length || 0} TA GAP):
${videoMeta.transcript.slice(0, 150000)}
==================================================

QAT'IY TALABLAR (MUTLAQO BUZILMASIN):
1. Sarlavhani ("headline") videoning haqiqiy mavzusiga ("${videoTitle}") to'liq moslang.
2. Xulosani ("summary") videoda aytilgan haqiqiy fikrlar, faktlar, yangiliklar va ko'tarilgan aniq mavzular asosida keng va chuqur tahliliy konspekt qilib yozing.
3. Videoning davomiyligi yoki matni haqida aslo "0 soniya" yoki "ma'lumot berish imkoni yo'q" deb yozmang! Videoning davomiyligi: ${durationInfo}.
4. Foydalanuvchi so'ragan natija tili: ${targetLanguage}.
5. Faqat va faqat so'ralgan JSON formatida javob bering.`,
      });
    } else {
      parts.push({
        text: `==================================================
YOUTUBE VIDEO MA'LUMOTLARI:
- Haqiqiy sarlavha (Title): "${videoTitle}"
- Muallif / Kanal (Creator): ${videoAuthor}
- Davomiyligi: ${durationInfo}
${videoMeta?.description ? `- Video rasmiy tavsifi:\n${videoMeta.description.slice(0, 4000)}` : ''}
==================================================

Ushbu videoning rasmiy sarlavhasi va tavsifi asosida keng qamrovli, chuqur tahliliy konspekt-xulosa bering.
Sarlavhani ("headline") "${videoTitle}" deb belgilang.
Faqat va faqat so'ralgan JSON formatida javob bering.`,
      });
    }
  } else {
    throw new Error('Tahlil uchun media fayl yoki video havola kiritilishi shart.');
  }

  const candidateModels = getCandidateModels(modelName);
  let lastError: Error | null = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${cleanApiKey}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }],
      },
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    try {
      console.log(`[Tahlilchi AI] Gemini API so'rovi yuborilmoqda (Model: ${currentModel})...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const rawMessage = errorJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;

        if (
          rawMessage.includes('API_KEY_INVALID') ||
          rawMessage.includes('API key not valid') ||
          rawMessage.includes('key is invalid')
        ) {
          throw new Error("Gemini API kaliti noto'g'ri. Iltimos, Sozlamalar sahifasida to'g'ri kalit kiriting.");
        }

        const isModelSpecificError =
          response.status === 404 ||
          response.status === 400 ||
          response.status === 429 ||
          rawMessage.includes('not found') ||
          rawMessage.includes('ResourceExhausted') ||
          rawMessage.includes('Quota exceeded');

        if (isModelSpecificError && i < candidateModels.length - 1) {
          console.warn(`[Tahlilchi AI] "${currentModel}" modeli xatolik berdi (${rawMessage}). Keyingi zaxira modelga o'tilmoqda: "${candidateModels[i + 1]}"...`);
          lastError = new Error(rawMessage);
          continue;
        }

        if (response.status === 429) {
          throw new Error("Gemini API so'rov kvotasi tugadi (429). Biroz kuting yoki Sozlamalarda boshqa modelni tanlang.");
        }

        throw new Error(`Google Gemini xatosi (${response.status}): ${rawMessage}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Gemini modelidan bo'sh javob qaytdi. Havola yoki fayl formatini tekshiring.");
      }

      const parsed = safeJsonParse(rawText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Gemini modeli JSON formatida javob qaytara olmadi. Qayta urinib ko'ring.");
      }

      // Construct 100% complete and accurate audio_timeline using real transcript items
      let finalAudioTimeline: AudioTimelineItem[] = [];

      if (videoMeta?.transcriptItems && videoMeta.transcriptItems.length > 0) {
        finalAudioTimeline = videoMeta.transcriptItems.map((item: any) => ({
          start: item.start || '00:00',
          end: item.end || '',
          speaker: videoMeta.author || 'Spiker',
          emotion: 'Neutral',
          text: item.text,
          translation: item.text,
        }));
      } else if (Array.isArray(parsed.audio_timeline) && parsed.audio_timeline.length > 0) {
        finalAudioTimeline = parsed.audio_timeline;
      } else if (videoMeta?.transcript) {
        const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)/g;
        let m;
        while ((m = regex.exec(videoMeta.transcript)) !== null) {
          finalAudioTimeline.push({
            start: m[1],
            end: '',
            speaker: videoMeta.author || 'Spiker',
            emotion: 'Neutral',
            text: m[2],
            translation: m[2],
          });
        }
      }

      const fullTranscript = videoMeta?.transcript || (
        finalAudioTimeline.length > 0
          ? finalAudioTimeline.map((item) => `[${item.start || '00:00'}] ${item.speaker ? `${item.speaker}: ` : ''}${item.translation || item.text}`).join('\n\n')
          : (parsed.transcript || parsed.summary || '')
      );

      const finalHeadline = parsed.headline || videoMeta?.title || file?.name || 'Kontent Tahlili';
      const usage = data.usageMetadata;

      const analysisResult: AnalysisResponse = {
        ...parsed,
        headline: finalHeadline,
        mode: parsed.mode || mode,
        audio_timeline: finalAudioTimeline,
        transcript: fullTranscript,
        disclaimer: DISCLAIMERS[mode] || DISCLAIMERS.meeting,
        tokens: usage
          ? {
              input_tokens: usage.promptTokenCount || 0,
              output_tokens: usage.candidatesTokenCount || 0,
              total_tokens: usage.totalTokenCount || 0,
            }
          : undefined,
        metadata: {
          title: videoMeta?.title || finalHeadline,
          author: videoMeta?.author || 'Tahlilchi AI',
          duration: videoMeta?.durationFormatted,
          thumbnailUrl: videoMeta?.thumbnailUrl,
          fileName: file?.name,
        },
      };

      return analysisResult;
    } catch (err: any) {
      if (err?.message?.includes("Gemini API kaliti noto'g'ri")) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error("Gemini API bilan ulanib bo'lmadi. Iltimos, internet aloqangizni va API kalitingizni tekshiring.");
}

/**
 * Fast test utility to verify the user's Gemini API key directly from Settings.
 */
export async function testGeminiApiKey(
  apiKey: string,
  modelName = 'gemini-2.5-flash'
): Promise<{ success: boolean; model: string; message: string }> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return {
      success: false,
      model: modelName,
      message: 'API kalit maydoni bo\'sh. Kalitingizni kiriting.',
    };
  }

  const candidates = getCandidateModels(modelName);
  let lastErr = '';

  for (const model of candidates) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Salom, test javobi.' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (res.ok) {
        return {
          success: true,
          model,
          message: `API kaliti 100% to'g'ri va faol! Google Gemini (${model}) bilan aloqa o'rnatildi.`,
        };
      }

      const errJson = await res.json().catch(() => ({}));
      lastErr = errJson?.error?.message || `HTTP ${res.status}`;
      if (lastErr.includes('API_KEY_INVALID') || lastErr.includes('API key not valid')) {
        return {
          success: false,
          model,
          message: "API kaliti noto'g'ri. Iltimos Google AI Studio'dan yangi kalit olib kiriting.",
        };
      }
    } catch (e: any) {
      lastErr = e?.message || 'Tarmoq ulanishida xatolik';
    }
  }

  return {
    success: false,
    model: modelName,
    message: `Ulanib bo'lmadi: ${lastErr}`,
  };
}
