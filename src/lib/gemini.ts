import { GoogleGenAI } from '@google/genai';
import { AnalysisMode, OutputLanguage, AnalysisResponse, TimestampItem } from '@/types';

export const LANGUAGE_NAMES: Record<OutputLanguage, string> = {
  uz: "O'zbek tili (lotin yozuvida)",
  ru: 'Русский язык',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  ko: '한국어 (Korean)',
  ar: 'العربية (Arabic)',
  hi: 'हिन्दी (Hindi)',
  tr: 'Türkçe',
  auto: 'Videoning asl tilida',
};

export const DISCLAIMERS: Record<AnalysisMode, string> = {
  meeting: 'Uchrashuv xulosasi va harakatlar rejasi AI modeli tomonidan video/audio tahlili asosida tuzilgan.',
  news: 'Fakt-tekshiruv (Fact-check) natijalari video ichidagi bayonotlarga asoslangan AI taxmini bo\'lib, tashqi huquqiy tekshiruv o\'rnini bosmaydi.',
  education: 'Dars konspekti va test savollari AI tomonidan tuzilgan bo\'lib, mustaqil o\'rganish uchun yordamchi xarakterga ega.',
  child: 'Bolalar rejimi ota-onalarga yo\'l-yo\'riq berish uchun mo\'ljallangan vositadir. 13 yoshgacha bo\'lgan bolalar uchun rasmiy sertifikat hisoblanmaydi.',
  interview: 'Nomzodning moslik bali (Match Score) va xulosalar faqat ichki maslahat uchun bo\'lib, avtomatik ishga qabul qilish yoki rad etish qarori emas.',
  pitch: 'Vizual va notiqlik tahlili standart 1 FPS video namuna olishga asoslangan. Tezkor mikromimikalar qamrab olinmagan bo\'lishi mumkin.',
  audio: 'Spikerlar va hissiyotlar audio trekning spektral va intonatsion xususiyatlari asosida aniqlangan.',
  multi: 'Ko\'p tilli sintez multimodal tarjima va tahlil asosida shakllantirildi.',
  chat: 'Javoblar videoning umumiy kontekstiga asoslanadi.',
};

export const buildSystemPrompt = (
  mode: AnalysisMode,
  targetLang: OutputLanguage = 'uz',
  options?: {
    childAge?: number;
    targetRole?: string;
    seniorityLevel?: string;
    techStack?: string;
    enableTranscript?: boolean;
    customPrompt?: string;
  }
): string => {
  const currentYear = new Date().getFullYear();
  const langName = LANGUAGE_NAMES[targetLang] || "O'zbek tili";

  const commonRules = `
Joriy yil: ${currentYear}.
Barcha natijaviy matnlar, sarlavhalar va tushuntirishlarni mutlaqo ${langName}da yozing.
MUHIM: Javobingiz FAQAT valid JSON obyekt bo'lishi shart. Hech qanday boshqa matn, markdown kod bloki yoki izohlarsiz, to'g'ridan-to'g'ri valid JSON qaytaring.
Har bir rejimda videodagi muhim joylarga vaqt belgilarini (timestamps) '02:15' yoki '01:20:45' formatida aniq ko'rsating.
${options?.customPrompt ? `Foydalanuvchining maxsus talabi: ${options.customPrompt}` : ''}
`;

  switch (mode) {
    case 'meeting':
      return `${commonRules}
Siz professional uchrashuv va korporativ boshqaruv tahlilchisisiz.
Quyidagi JSON struktura bo'yicha javob bering:
{
  "summary": "Uchrashuvning 2-3 jumlali siqiq mazmuni",
  "agenda": "Kun tartibi va muhokama qilingan masalalar ketma-ketligi",
  "speakers": [
    {"id": "Spiker 1 (Taxminiy ismi/roli)", "talk_time_pct": 50}
  ],
  "key_decisions": [
    {"decision": "Qabul qilingan muhim qaror", "timestamp": "12:30"}
  ],
  "action_items": [
    {"task": "Vazifa nomi", "assignee": "Mas'ul shaxs", "deadline": "Muddati (agar aytilgan bo'lsa)", "timestamp": "15:45"}
  ],
  "open_questions": [
    "Yechimi topilmagan yoki muhokamada ochiq qolgan savol"
  ],
  ${options?.enableTranscript ? '"key_transcripts": [{"time": "02:15", "text": "muhim iqtibos"}],' : '"key_transcripts": [],'}
  "timestamps": [
    {"time": "00:00", "text": "Kirish va tanishuv"}
  ]
}`;

    case 'education':
      return `${commonRules}
Siz tajribali pedagog va ta'lim metodistisiz. Dars videosidan tushunarli konspekt va bilimni sinash uchun test (quiz) tuzing.
Quyidagi JSON formatda javob bering:
{
  "summary": "Darsning umumiy mazmuni va maqsadi",
  "prerequisites": ["Ushbu darsni tushunish uchun zarur bo'lgan dastlabki bilimlar"],
  "core_concepts": [
    {"concept": "Tushuncha nomi", "explanation": "Oddiy va tushunarli tildagi izoh", "timestamp": "04:15"}
  ],
  "quiz": [
    {
      "id": 1,
      "question": "Dars mazmuniga oid savol",
      "options": ["A varianti", "B varianti", "C varianti", "D varianti"],
      "correct_index": 0,
      "explanation": "Nega aynan shu javob to'g'ri ekanligi tushuntirishi",
      "timestamp_hint": "08:30"
    }
  ],
  "timestamps": [
    {"time": "00:00", "text": "Mavzuga kirish"}
  ]
}`;

    case 'child':
      return `${commonRules}
Siz bolalar psixologiyasi va ota-onalar xavfsizligi bo'yicha tahlilchisiz.
Tekshirilayotgan bola yoshi: ${options?.childAge || 5} yosh.
Quyidagi JSON formatda javob bering:
{
  "summary": "Videoning bolalar uchun xulosasi va umumiy bahosi",
  "safety_verdict": "SAFE", // yoki "CAUTION" yoki "UNSAFE"
  "safety_score": 85,
  "negative_triggers": [
    {"type": "Qo'rqinchli sahna / Zo'ravonlik / Baqirish / Zararli odat", "intensity": "O'rtacha", "timestamp": "03:20", "description": "Sahna nima haqida ekanligi"}
  ],
  "positive_themes": ["Do'stlik", "O'zaro yordam", "Ilmga qiziqish"],
  "parental_advice": "Ota-onalar uchun ushbu video bo'yicha aniq xulosa va tavsiyalar",
  "timestamps": [
    {"time": "00:00", "text": "Boshlanishi"}
  ]
}`;

    case 'interview':
      return `${commonRules}
Siz professional Senior Texnik HR va Interview Evaluatorsiz.
Nomzod topshirayotgan lavozim: ${options?.targetRole || 'Developer'} (${options?.seniorityLevel || 'Middle'} daraja).
Kerakli texnologiyalar: ${options?.techStack || 'General'}.
Quyidagi JSON formatda javob bering:
{
  "summary": "Nomzodning umumiy suhbatdagi chiqishi va taassurot",
  "match_score": 85,
  "hiring_verdict": "STRONG_HIRE", // yoki "HIRE", "LEANING_NO", "REJECT"
  "strengths": [
    "Kuchli tomoni (vaqt belgisi bilan masalan: 05:20 da arxitekturani yaxshi tushuntirdi)"
  ],
  "weaknesses": [
    "Bo'sh joyi yoki xatosi (vaqt belgisi bilan)"
  ],
  "interviewer_advice": "Intervyu oluvchi uchun maslahat: keyingi bosqichda aynan qaysi mavzularni chuqurroq tekshirish kerak",
  "candidate_advice": "Nomzod o'z ustida ishlashi uchun amaliy tavsiyalar",
  "timestamps": [
    {"time": "00:00", "text": "Suhbat boshlanishi"}
  ]
}`;

    case 'pitch':
      return `${commonRules}
Siz ommaviy nutq va taqdimotlar bo'yicha professional spiker-murabbiysiz.
Nutqni 3V qoidasi (Verbal - so'zlar, Visual - tana tili, Vocal - ovoz) bo'yicha baholang.
Quyidagi JSON formatda javob bering:
{
  "summary": "Taqdimotning umumiy bahosi va notiqning yetkazib bera olish mahorati",
  "overall_pitch_score": 80,
  "verbal_score": 85,
  "visual_score": 75,
  "vocal_score": 80,
  "parasite_words": ["demak", "xullas", "e-e-e"],
  "pitch_recommendations": [
    "Nutqdagi pauzalardan unumli foydalanish",
    "Kameraga/auditoriyaga to'g'ri qarash",
    "Xulosa qismida urg'uni kuchaytirish"
  ],
  "timestamps": [
    {"time": "00:00", "text": "Kirish nutqi"}
  ]
}`;

    case 'news':
      return `${commonRules}
Siz professional fakt-cheker va media tahlilchisisiz.
Quyidagi JSON formatda javob bering:
{
  "headline": "Asosiy yangilik sarlavhasi",
  "summary": "3-4 gapdan iborat xolis xulosa",
  "sentiment": "Neytral",
  "bias_indicators": ["Bir tomonlama yondashuv yoki emotsional manipulyatsiya belgilari"],
  "key_facts": ["Tasdiqlangan asosiy faktlar"],
  "fact_check": [
    {"claim": "Videoda keltirilgan da'vo", "verdict": "True", "explanation": "Nega bunday baho berilgani", "timestamp": "02:15"}
  ],
  "timestamps": [
    {"time": "00:00", "text": "Yangiliklar blokining boshlanishi"}
  ]
}`;

    case 'audio':
      return `${commonRules}
Siz audio tahlilchi va nutq muhandisisiz. Audioni spikerlarga ajrating (diarizatsiya), hissiyotlarni va transkriptini bering.
Quyidagi JSON formatda javob bering:
{
  "summary": "Audioning umumiy mazmuni va suhbatdoshlar xulosasi",
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:15",
      "speaker": "Spiker 1",
      "emotion": "Neutral",
      "text": "Gapirilgan gap",
      "translation": "Tarjimasi"
    }
  ],
  "timestamps": [
    {"time": "00:00", "text": "Audio boshlanishi"}
  ]
}`;

    default:
      return `${commonRules}
Quyidagi JSON formatda umumlashtirilgan xulosa va tahlil bering:
{
  "summary": "To'liq va batafsil xulosa",
  "agenda": "Mavzular ketma-ketligi",
  "key_findings": ["Asosiy xulosalar"],
  "action_items": [{"task": "Vazifa", "assignee": "Mas'ul", "deadline": "", "timestamp": "01:00"}],
  "timestamps": [{"time": "00:00", "text": "Boshlanishi"}]
}`;
  }
};

export const extractTimestamps = (text: string): TimestampItem[] => {
  const timestamps: TimestampItem[] = [];
  const pattern = /(?:\[|\b)(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\b)\s*[-–—:]*\s*([^\n\r]*)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const tStr = match[1];
    const desc = match[2].trim().slice(0, 100);
    if (!timestamps.some((t) => t.time === tStr)) {
      timestamps.push({ time: tStr, text: desc || "Ushbu vaqtga o'tish" });
    }
  }
  return timestamps;
};

export const safeJsonParse = (raw: string): any => {
  if (!raw || !raw.trim()) {
    return { summary: 'Tahlil natijasi olinmadi.' };
  }

  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        // ignore
      }
    }
    return {
      summary: cleaned,
      timestamps: extractTimestamps(cleaned),
    };
  }
};
