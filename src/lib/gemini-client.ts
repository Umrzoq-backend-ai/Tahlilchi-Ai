import { AnalysisMode, OutputLanguage, AnalysisResponse } from '@/types';
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
 * Completely eliminates Vercel 504 Gateway Timeout and 4.5MB payload limits by connecting
 * the user's browser directly to Google Gemini API (generativelanguage.googleapis.com).
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

    // Standard protobuf camelCase inlineData
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
    // Standard protobuf camelCase fileData with public YouTube link
    parts.push({
      fileData: {
        fileUri: videoUrl,
        mimeType: 'video/mp4',
      },
    });
    parts.push({
      text: `Ushbu YouTube videoni to'liq multimodal formatda (kadrlar va audio ovozini birgalikda) tahlil qiling.
Videoda aytilgan barcha gaplarni "audio_timeline" massivida xronologik tartibda so'zma-so'z daqiqama-daqiqa (timestamps bilan) yozing.
Foydalanuvchi butun videoni ko'rmasdan ham to'liq tushunishi uchun "summary" qismida KENG QAMROVLI, CHUQUR va MUKAMMAL tahliliy konspekt-xulosa bering.
HECH QACHON "videoning davomiyligi 0 soniya", "video ochilmadi" yoki "video mazmuni yo'q" deb aytmang! Videoning haqiqiy audiosi va kadrlaridan foydalanib boy tahlil taqdim eting.
Faqat va faqat so'ralgan JSON formatida javob bering.`,
    });
  } else {
    throw new Error('Tahlil uchun media fayl yoki video havola kiritilishi shart.');
  }

  const candidateModels = getCandidateModels(modelName);
  let lastError: Error | null = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${cleanApiKey}`;

    // Official Google Gemini REST API v1beta schema
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

        // If key is invalid, fail immediately with clear instructions
        if (
          rawMessage.includes('API_KEY_INVALID') ||
          rawMessage.includes('API key not valid') ||
          rawMessage.includes('key is invalid')
        ) {
          throw new Error("Gemini API kaliti noto'g'ri. Iltimos, Sozlamalar sahifasida to'g'ri kalit kiriting.");
        }

        // If model is not found (404) or unsupported (400) or quota exceeded (429), try next fallback model
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

      // Metadata & token usage calculations
      const usage = data.usageMetadata;
      const analysisResult: AnalysisResponse = {
        ...parsed,
        mode: parsed.mode || mode,
        disclaimer: DISCLAIMERS[mode] || DISCLAIMERS.meeting,
        tokens: usage
          ? {
              input_tokens: usage.promptTokenCount || 0,
              output_tokens: usage.candidatesTokenCount || 0,
              total_tokens: usage.totalTokenCount || 0,
            }
          : undefined,
        metadata: {
          title: parsed.headline || parsed.document_title || file?.name || videoUrl || 'Tahlil Natijasi',
          author: parsed.author || 'Tahlilchi AI',
        },
      };

      return analysisResult;
    } catch (err: any) {
      if (err?.message?.includes("Gemini API kaliti noto'g'ri")) {
        throw err;
      }
      lastError = err;
      // If there are more models to try, loop continues
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
