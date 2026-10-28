import { AnalysisMode, OutputLanguage, AnalysisResponse } from '@/types';
import { buildSystemPrompt, safeJsonParse, DISCLAIMERS } from './gemini';

/**
 * Convert a File or Blob into Base64 string in browser without exceeding call stack limits
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data:*/*;base64, prefix
      const base64 = result.split(',')[1];
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
 * Direct Client-Side Gemini Multimodal Analyzer
 * Bypasses Vercel Serverless Function 4.5MB request body limit and 60s timeout.
 * Directly communicates with Google Generative Language API using the user's stored API key.
 */
export async function analyzeMediaDirectly(params: ClientAnalyzeParams): Promise<AnalysisResponse> {
  const {
    apiKey,
    modelName = 'gemini-2.5-flash',
    file,
    mode,
    targetLanguage,
    enableTranscript = true,
    childAge = 6,
    targetRole = 'Full Stack Developer',
    seniorityLevel = 'Middle',
    techStack = 'General',
    customPrompt = '',
  } = params;

  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set it in Settings.');
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
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'mp3') mimeType = 'audio/mpeg';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'm4a') mimeType = 'audio/mp4';
    else if (ext === 'ogg' || ext === 'opus') mimeType = 'audio/ogg';
    else if (ext === 'mp4') mimeType = 'video/mp4';
    else if (ext === 'webm') mimeType = 'video/webm';
    else if (ext === 'mov') mimeType = 'video/quicktime';

    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Data,
      },
    });

    const fileInstruction = mode === 'document'
      ? `Ushbu PDF hujjatni ("${file.name}") to'liq o'rganib chiq. Undagi barcha matnlar, boblar, ma'lumotlar va asosiy tezislarni to'liq transkript va audio_timeline sifatida tizimli tahlil qil.`
      : mode === 'audio'
      ? `Ushbu audio faylni ("${file.name}") boshidan oxirigacha eshitib tahlil qil. Agar bu qo'shiq bo'lsa barcha so'zlarini (lyrics) audio_timeline va transcriptda to'liq yoz va tarjimasini ber. Agar nutq/podkast bo'lsa, spikerlar gaplarini so'zma-so'z transkript qil.`
      : `Ushbu materialni ("${file.name}") belgilangan rejim bo'yicha tahlil qil. Videoda gapirilgan barcha gaplarni audio_timeline va transcriptda so'zma-so'z to'liq ko'rsat.`;

    parts.push({
      text: fileInstruction,
    });
  } else if (params.videoUrl) {
    parts.push({
      file_data: {
        file_uri: params.videoUrl,
        mime_type: 'video/mp4',
      },
    });
    parts.push({
      text: `Ushbu YouTube videoni to'liq multimodal formatda (kadrlar va audio trekini birgalikda) tahlil qiling. Unda gapirilgan barcha gaplarni audio_timeline va transcriptda daqiqama-daqiqa so'zma-so'z ko'rsatib, to'liq JSON formatida javob bering.`,
    });
  } else {
    throw new Error('Tahlil uchun media fayl yoki video havola kiritilishi shart.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.2,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message =
      errorJson?.error?.message ||
      `Google Gemini API xatosi (${response.status}): ${response.statusText}`;

    if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
      throw new Error("Gemini API kaliti noto'g'ri. Iltimos Sozlamalar sahifasida kalitingizni tekshiring.");
    }
    if (message.includes('RESOURCE_EXHAUSTED') || response.status === 429) {
      throw new Error("Gemini API so'rov kvotasi tugadi (429). Biroz kuting yoki Sozlamalarda boshqa modelni tanlang.");
    }
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini modelidan bo'sh javob qaytdi. Fayl hajmini yoki formatini tekshiring.");
  }

  const parsed = safeJsonParse(rawText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Gemini modeli JSON formatida javob qaytara olmadi. Qayta urinib ko'ring.");
  }

  // Inject metadata & token counts
  const usage = data.usageMetadata;
  const analysisResult: AnalysisResponse = {
    ...parsed,
    mode: parsed.mode || mode,
    disclaimer: DISCLAIMERS[mode] || DISCLAIMERS.meeting,
    tokens: usage
      ? {
          prompt_tokens: usage.promptTokenCount || 0,
          completion_tokens: usage.candidatesTokenCount || 0,
          total_tokens: usage.totalTokenCount || 0,
        }
      : undefined,
    metadata: {
      title: parsed.headline || parsed.document_title || file?.name || 'Tahlil Natijasi',
      author: parsed.author || 'Tahlilchi AI',
    },
  };

  return analysisResult;
}
