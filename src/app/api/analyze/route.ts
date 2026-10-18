import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, safeJsonParse, DISCLAIMERS } from '@/lib/gemini';
import { AnalysisMode, OutputLanguage, AnalysisResponse } from '@/types';

export const maxDuration = 60; // 60s timeout for video analysis

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let apiKey = '';
    let modelName = 'gemini-2.0-flash';
    let mode: AnalysisMode = 'meeting';
    let targetLanguage: OutputLanguage = 'uz';
    let promptText = '';
    let videoUrl = '';
    let enableTranscript = false;
    let childAge = 5;
    let targetRole = 'Full Stack Developer';
    let seniorityLevel = 'Middle';
    let techStack = 'General';
    let filePart: any = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      apiKey = (formData.get('api_key') as string) || '';
      modelName = (formData.get('model_name') as string) || 'gemini-2.0-flash';
      mode = (formData.get('mode') as AnalysisMode) || 'meeting';
      targetLanguage = (formData.get('target_language') as OutputLanguage) || 'uz';
      promptText = (formData.get('prompt') as string) || '';
      enableTranscript = formData.get('enable_transcript') === 'true';
      childAge = parseInt((formData.get('child_age') as string) || '5', 10);
      targetRole = (formData.get('target_role') as string) || 'Developer';
      seniorityLevel = (formData.get('seniority_level') as string) || 'Middle';
      techStack = (formData.get('tech_stack') as string) || 'General';

      const file = formData.get('video') as File | null;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        filePart = {
          inlineData: {
            data: base64,
            mimeType: file.type || 'video/mp4',
          },
        };
      }
    } else {
      const body = await req.json();
      apiKey = body.api_key;
      modelName = body.model_name || 'gemini-2.0-flash';
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
      return NextResponse.json({ detail: 'Gemini API kaliti talab qilinadi.' }, { status: 400 });
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
    if (filePart) {
      contents.push(filePart);
      contents.push({ text: `${systemInstruction}\n\nUshbu media faylni chuqur tahlil qiling va faqat so'ralgan JSON formatida javob bering.` });
    } else if (videoUrl) {
      contents.push({
        text: `${systemInstruction}\n\nTahlil qilinadigan YouTube video havolasi: ${videoUrl}\n\nVideoni multimodal o'rganib, faqat so'ralgan JSON formatida javob bering.`,
      });
    } else {
      return NextResponse.json({ detail: 'Video havola yoki fayl kiritilishi shart.' }, { status: 400 });
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

    // Tokens hisoblash
    const um = response.usageMetadata;
    const tokens = {
      input_tokens: um?.promptTokenCount || 0,
      output_tokens: um?.candidatesTokenCount || 0,
      total_tokens: um?.totalTokenCount || (um?.promptTokenCount || 0) + (um?.candidatesTokenCount || 0),
    };

    const resultResponse: AnalysisResponse = {
      mode,
      summary: parsed.summary || 'Tahlil yakunlandi.',
      agenda: parsed.agenda,
      speakers: parsed.speakers || [],
      key_decisions: parsed.key_decisions || [],
      action_items: parsed.action_items || [],
      open_questions: parsed.open_questions || [],
      key_transcripts: parsed.key_transcripts || [],
      prerequisites: parsed.prerequisites || [],
      core_concepts: parsed.core_concepts || [],
      quiz: parsed.quiz || [],
      headline: parsed.headline,
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
      transcript: parsed.summary,
      timestamps: parsed.timestamps || [],
      tokens,
      disclaimer: DISCLAIMERS[mode],
    };

    return NextResponse.json(resultResponse);
  } catch (err: any) {
    console.error('Analyze API Error:', err);
    return NextResponse.json(
      { detail: err.message || 'Gemini tahlilida kutilmagan xatolik yuz berdi.' },
      { status: 500 }
    );
  }
}
