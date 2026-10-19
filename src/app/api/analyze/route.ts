import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, safeJsonParse, DISCLAIMERS } from '@/lib/gemini';
import { fetchYouTubeVideoDetails } from '@/lib/youtube';
import { AnalysisMode, OutputLanguage, AnalysisResponse } from '@/types';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const maxDuration = 60; // 60s max execution timeout for Vercel Hobby plan

function resolveMimeType(fileName: string, clientMimeType?: string): string {
  let cleanType = (clientMimeType || '').split(';')[0].trim().toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (cleanType && cleanType !== 'application/octet-stream') {
    if (cleanType === 'audio/mp3') return 'audio/mpeg';
    if (cleanType === 'video/quicktime' && ext === 'mov') return 'video/quicktime';
    return cleanType;
  }

  switch (ext) {
    // Audio formats
    case 'ogg':
    case 'oga':
    case 'opus':
      return 'audio/ogg';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    case 'flac':
      return 'audio/flac';
    case 'weba':
      return 'audio/webm';

    // Video formats
    case 'mp4':
    case 'm4v':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'avi':
      return 'video/x-msvideo';
    case 'mkv':
      return 'video/x-matroska';
    case 'flv':
      return 'video/x-flv';
    case 'wmv':
      return 'video/x-ms-wmv';

    // Document formats
    case 'pdf':
      return 'application/pdf';

    // Images
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';

    default:
      return cleanType || 'application/octet-stream';
  }
}

function formatErrorMessage(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    return "Gemini API kaliti noto'g'ri yoki yaroqsiz. Iltimos, Sozlamalar (Settings) sahifasida Google AI Studio kalitingizni qayta tekshiring.";
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('Quota exceeded')) {
    return "Gemini API so'rov limiti tugagan (Quota exceeded). Biroz kuting yoki Sozlamalarda boshqa modelni (masalan Gemini 2.5 Flash) tanlang.";
  }
  if (msg.includes('503') || msg.includes('overloaded')) {
    return "Google Gemini serveri ayni paytda band. Iltimos, 10-15 soniyadan so'ng qayta urinib ko'ring.";
  }
  if (msg.includes('Request payload size exceeds the limit')) {
    return "Fayl hajmi ruxsat etilgan limitdan oshdi. Iltimos, ixchamroq audio/video fayl yuklang.";
  }
  return msg || "Gemini tahlilida kutilmagan xatolik yuz berdi.";
}

export async function POST(req: NextRequest) {
  const tempFilesToClean: string[] = [];
  try {
    const contentType = req.headers.get('content-type') || '';
    let apiKey = '';
    let modelName = 'gemini-2.5-flash';
    let mode: AnalysisMode = 'meeting';
    let targetLanguage: OutputLanguage = 'uz';
    let promptText = '';
    let videoUrl = '';
    let enableTranscript = false;
    let childAge = 5;
    let targetRole = 'Full Stack Developer';
    let seniorityLevel = 'Middle';
    let techStack = 'General';

    let uploadedFile: {
      buffer: Buffer;
      name: string;
      mimeType: string;
      size: number;
      isPdf: boolean;
      isAudio: boolean;
      isVideo: boolean;
    } | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      apiKey = (formData.get('api_key') as string) || '';
      modelName = (formData.get('model_name') as string) || 'gemini-2.5-flash';
      mode = (formData.get('mode') as AnalysisMode) || 'meeting';
      targetLanguage = (formData.get('target_language') as OutputLanguage) || 'uz';
      promptText = (formData.get('prompt') as string) || '';
      enableTranscript = formData.get('enable_transcript') === 'true';
      childAge = parseInt((formData.get('child_age') as string) || '5', 10);
      targetRole = (formData.get('target_role') as string) || 'Developer';
      seniorityLevel = (formData.get('seniority_level') as string) || 'Middle';
      techStack = (formData.get('tech_stack') as string) || 'General';

      const file = (formData.get('file') ||
        formData.get('video') ||
        formData.get('audio') ||
        formData.get('pdf')) as File | null;

      if (file && file.size > 0) {
        const mimeType = resolveMimeType(file.name, file.type);
        const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isAudio = mimeType.startsWith('audio/');
        const isVideo = mimeType.startsWith('video/');
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        uploadedFile = {
          buffer,
          name: file.name,
          mimeType,
          size: file.size,
          isPdf,
          isAudio,
          isVideo,
        };
      }
    } else {
      const body = await req.json();
      apiKey = body.api_key;
      modelName = body.model_name || 'gemini-2.5-flash';
      mode = body.mode || 'meeting';
      targetLanguage = body.target_language || 'uz';
      promptText = body.prompt || '';
      videoUrl = body.video_url || '';
      enableTranscript = !!body.enable_transcript;
      childAge = body.child_age || 5;
      targetRole = body.target_role || 'Developer';
      seniorityLevel = body.seniority_level || 'Middle';
      techStack = body.tech_stack || 'General';
    }

    if (!apiKey) {
      return NextResponse.json(
        { detail: 'Gemini API kaliti talab qilinadi. Sozlamalar sahifasida API kalitingizni kiriting.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemPrompt(mode, targetLanguage, {
      childAge,
      targetRole,
      seniorityLevel,
      techStack,
      enableTranscript,
      customPrompt: promptText,
    });

    const contents: any[] = [];
    let videoMeta: any = null;

    if (uploadedFile) {
      // If file is large (> 15MB), optimize locally using ffmpeg first so analysis runs in seconds
      let fileToProcessPath: string | null = null;
      let mimeTypeToSend = uploadedFile.mimeType;

      const safeBaseName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const tempFilePath = path.join(os.tmpdir(), `tahlilchi-${Date.now()}-${safeBaseName}`);
      await fs.writeFile(tempFilePath, uploadedFile.buffer);
      tempFilesToClean.push(tempFilePath);
      fileToProcessPath = tempFilePath;

      if (uploadedFile.isVideo && uploadedFile.size > 15 * 1024 * 1024) {
        const optimizedVideoPath = path.join(
          os.tmpdir(),
          `tahlilchi-opt-${Date.now()}-${safeBaseName}.mp4`
        );
        tempFilesToClean.push(optimizedVideoPath);

        try {
          console.log(`[Tahlilchi AI] Katta video (${(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB) AI uchun tezlashtirilmoqda...`);
          // Gemini multimodality samples 1 frame per second. Scaling to 480p and 1fps with 64k AAC audio
          // shrinks a 500MB video to 5-10MB in seconds while preserving 100% analysis precision!
          await execFileAsync(
            'ffmpeg',
            [
              '-i', tempFilePath,
              '-vf', 'scale=-2:480,fps=1',
              '-c:v', 'libx264',
              '-preset', 'ultrafast',
              '-crf', '30',
              '-c:a', 'aac',
              '-b:a', '64k',
              optimizedVideoPath,
              '-y',
            ],
            { timeout: 90000 }
          );

          const optStat = await fs.stat(optimizedVideoPath);
          console.log(`[Tahlilchi AI] Video optimallashdi: ${(optStat.size / (1024 * 1024)).toFixed(1)}MB (asli: ${(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB)`);
          fileToProcessPath = optimizedVideoPath;
          mimeTypeToSend = 'video/mp4';
        } catch (ffmpegErr) {
          console.warn('[Tahlilchi AI] ffmpeg optimallashtirish xatosi, asl fayl yuboriladi:', ffmpegErr);
        }
      } else if (uploadedFile.isAudio && uploadedFile.size > 20 * 1024 * 1024) {
        const optimizedAudioPath = path.join(
          os.tmpdir(),
          `tahlilchi-opt-${Date.now()}-${safeBaseName}.mp3`
        );
        tempFilesToClean.push(optimizedAudioPath);

        try {
          console.log(`[Tahlilchi AI] Katta audio (${(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB) optimallashmoqda...`);
          await execFileAsync(
            'ffmpeg',
            [
              '-i', tempFilePath,
              '-c:a', 'libmp3lame',
              '-b:a', '64k',
              '-ac', '1',
              optimizedAudioPath,
              '-y',
            ],
            { timeout: 45000 }
          );
          fileToProcessPath = optimizedAudioPath;
          mimeTypeToSend = 'audio/mpeg';
        } catch (ffmpegErr) {
          console.warn('[Tahlilchi AI] audio ffmpeg xatosi:', ffmpegErr);
        }
      }

      // Check final file size:
      // If <= 15MB: use inline base64 for instant analysis without Google Files API wait
      // If > 15MB: use Google GenAI Files API upload
      const stat = await fs.stat(fileToProcessPath);
      if (stat.size <= 15 * 1024 * 1024) {
        const processedBuffer = await fs.readFile(fileToProcessPath);
        contents.push({
          inlineData: {
            data: processedBuffer.toString('base64'),
            mimeType: mimeTypeToSend,
          },
        });
      } else {
        const uploadResult = await ai.files.upload({
          file: fileToProcessPath,
          config: {
            mimeType: mimeTypeToSend,
          },
        });

        let fileInfo = uploadResult;
        const uploadName = uploadResult.name;
        if (uploadedFile.isVideo && uploadName) {
          let attempts = 0;
          while (fileInfo.state === 'PROCESSING' && attempts < 30) {
            await new Promise((r) => setTimeout(r, 2000));
            fileInfo = await ai.files.get({ name: uploadName });
            attempts++;
          }
        }

        contents.push({
          fileData: {
            fileUri: fileInfo.uri,
            mimeType: fileInfo.mimeType || mimeTypeToSend,
          },
        });
      }

      // Add appropriate multimodal instructions depending on file type
      if (uploadedFile.isPdf) {
        contents.push({
          text: `${systemInstruction}\n\nUshbu yuklangan "${uploadedFile.name}" nomli PDF hujjatning (hisobot, kitob, ilmiy maqola, taqdimot yoki shartnoma) to'liq matnini, jadvallarini, sahifalarini va asosiy dalillarini chuqur va sinchkovlik bilan tahlil qiling. Tahlilni FAQAT ushbu PDF hujjat ichidagi ma'lumotlarga asoslab, so'ralgan JSON formatida taqdim eting.`,
        });
      } else if (uploadedFile.isAudio) {
        contents.push({
          text: `${systemInstruction}\n\nUshbu yuklangan "${uploadedFile.name}" nomli audio / ovozli yozuvni (suhbat, dars, intervyu, majlis yoki podkast) sinchkovlik bilan tinglab, nutqini, spikerlarini, asosiy mavzularini va muhim xulosalarini tahlil qiling. Tahlilni FAQAT ushbu audio ichidagi haqiqiy nutq va tovushlarga asoslab, so'ralgan JSON formatida taqdim eting. Vaqt belgilarini (timestamps) audiodagi real daqiqalarga qarab aniq ko'rsating.`,
        });
      } else {
        contents.push({
          text: `${systemInstruction}\n\nUshbu yuklangan "${uploadedFile.name}" nomli videoning vizual kadrlarini va audio trekini sinchkovlik bilan tahlil qiling. Tahlilni FAQAT ushbu media fayl ichidagi haqiqiy voqealar va nutqqa asoslab bering. So'ralgan JSON formatida javob bering. Vaqt belgilarini (timestamps) aniq ko'rsating.`,
        });
      }
    } else if (videoUrl) {
      try {
        videoMeta = await fetchYouTubeVideoDetails(videoUrl);
      } catch (err) {
        console.warn('Failed to fetch YouTube details:', err);
      }

      const videoContext = videoMeta
        ? `
==================================================
TAHLIL QILINADIGAN ANIQ YOUTUBE VIDEO MA'LUMOTLARI:
- Haqiqiy sarlavha (Title): "${videoMeta.title}"
- Kanal / Muallif (Creator): ${videoMeta.author}
- Davomiyligi (Duration): ${videoMeta.durationFormatted} (${videoMeta.duration} soniya)
- Kalit mavzular: ${videoMeta.keywords?.slice(0, 10).join(', ') || 'Noma\'lum'}

- Video haqida to'liq rasmiy tavsif (Description):
${videoMeta.description || 'Tavsif mavjud emas.'}

${
  videoMeta.hasTranscript
    ? `- Video ichida aytilgan to'liq nutq va subtitrlar (Transkript):\n${videoMeta.transcript.slice(0, 25000)}`
    : `- Izoh: Ushbu videoda ochiq subtitr mavjud emas. Tahlilni yuqoridagi video nomi, tavsifidagi texnik parametrlar, da'volar va faktlarga 100% asoslab bajaring.`
}
==================================================

QAT'IY TALAB:
1. Siz FAQAT VA FAQAT ushbu "${videoMeta.title}" videosini tahlil qilishingiz shart!
2. Mutlaqo begona mavzuni (masalan, O'zbekiston iqtisodiyoti yoki boshqa videolarni) aralashtirmang!
3. Barcha sarlavha, xulosalar, fakt-tekshiruvlar, baholar va vaqt belgilari (timestamps) to'g'ridan-to'g'ri ushbu video mazmuniga tegishli bo'lsin.
4. Vaqt belgilarini (timestamps) videoning davomiyligi (${videoMeta.durationFormatted}) doirasida mantiqiy ko'rsating.
`
        : `Tahlil qilinadigan video havolasi: ${videoUrl}`;

      contents.push({
        text: `${systemInstruction}\n\n${videoContext}\n\nFaqat so'ralgan JSON formatida javob bering.`,
      });
    } else {
      return NextResponse.json({ detail: 'Video havola yoki media fayl kiritilishi shart.' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    const parsed = safeJsonParse(rawText);

    // Tokens calculation
    const um = response.usageMetadata;
    const tokens = {
      input_tokens: um?.promptTokenCount || 0,
      output_tokens: um?.candidatesTokenCount || 0,
      total_tokens: um?.totalTokenCount || (um?.promptTokenCount || 0) + (um?.candidatesTokenCount || 0),
    };

    const finalHeadline = parsed.headline || videoMeta?.title || uploadedFile?.name || 'Kontent Tahlili';

    // Construct full rich transcript text from audio_timeline or videoMeta
    let fullTranscriptText = videoMeta?.transcript || '';
    if (!fullTranscriptText && parsed.audio_timeline && Array.isArray(parsed.audio_timeline) && parsed.audio_timeline.length > 0) {
      fullTranscriptText = parsed.audio_timeline
        .map((item: any) => `[${item.start || '00:00'}] ${item.speaker ? `${item.speaker}: ` : ''}${item.translation || item.text}`)
        .join('\n\n');
    }
    if (!fullTranscriptText) {
      fullTranscriptText = parsed.transcript || parsed.summary || '';
    }

    const resultResponse: AnalysisResponse = {
      mode,
      headline: finalHeadline,
      summary: parsed.summary || 'Tahlil muvaffaqiyatli yakunlandi.',
      agenda: parsed.agenda,
      speakers: parsed.speakers || [],
      key_decisions: parsed.key_decisions || [],
      action_items: parsed.action_items || [],
      open_questions: parsed.open_questions || [],
      key_transcripts: parsed.key_transcripts || [],
      prerequisites: parsed.prerequisites || [],
      core_concepts: parsed.core_concepts || [],
      quiz: parsed.quiz || [],
      sentiment: parsed.sentiment,
      bias_indicators: parsed.bias_indicators || [],
      key_facts: parsed.key_facts || [],
      fact_check: parsed.fact_check || [],
      safety_verdict: parsed.safety_verdict,
      safety_score: parsed.safety_score,
      negative_triggers: parsed.negative_triggers || [],
      positive_themes: parsed.positive_themes || [],
      parental_advice: parsed.parental_advice,
      match_score: parsed.match_score,
      hiring_verdict: parsed.hiring_verdict,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      interviewer_advice: parsed.interviewer_advice,
      candidate_advice: parsed.candidate_advice,
      overall_pitch_score: parsed.overall_pitch_score,
      verbal_score: parsed.verbal_score,
      visual_score: parsed.visual_score,
      vocal_score: parsed.vocal_score,
      parasite_words: parsed.parasite_words || [],
      pitch_recommendations: parsed.pitch_recommendations || [],
      audio_timeline: parsed.audio_timeline || [],
      document_title: parsed.document_title,
      key_theses: parsed.key_theses || [],
      findings: parsed.findings || [],
      transcript: fullTranscriptText,
      timestamps: parsed.timestamps || [],
      tokens,
      disclaimer: DISCLAIMERS[mode],
      metadata: {
        title: uploadedFile?.isPdf
          ? (parsed.document_title || uploadedFile.name)
          : (videoMeta?.title || finalHeadline || uploadedFile?.name),
        author: uploadedFile?.isPdf
          ? 'PDF Hujjat'
          : uploadedFile?.isAudio
          ? 'Audio Yozuv'
          : (videoMeta?.author || (uploadedFile ? 'Yuklangan Video' : 'Noma\'lum')),
        duration: uploadedFile?.isPdf
          ? 'PDF Hujjat'
          : uploadedFile?.isAudio
          ? 'Audio Fayl'
          : (videoMeta?.durationFormatted || (uploadedFile ? 'Yuklangan Video' : undefined)),
        thumbnailUrl: videoMeta?.thumbnailUrl,
        isPdf: !!uploadedFile?.isPdf,
        fileName: uploadedFile?.name,
      },
    };

    return NextResponse.json(resultResponse);
  } catch (err: any) {
    console.error('Analyze API Error:', err);
    return NextResponse.json(
      { detail: formatErrorMessage(err) },
      { status: 500 }
    );
  } finally {
    for (const f of tempFilesToClean) {
      await fs.unlink(f).catch(() => {});
    }
  }
}
