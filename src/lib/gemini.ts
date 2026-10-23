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
  document: 'PDF va hujjat tahlili hujjat matni va tuzilmasi asosida AI tomonidan shakllantirilgan xulosalardir.',
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

QAT'IY VA MUHIM TALABLAR:
1. "audio_timeline" - ENG ASOSIY QISM:
   Videoda/audioda aytilgan BARCHA gaplarni boshidan oxirigacha (hatto video 1-2 soatlik bo'lsa ham) to'liq xronologik ketma-ketlikda transkript qiling:
   - "start" va "end": vaqt oralig'i (masalan: "00:00", "01:30", "15:45")
   - "speaker": gapiruvchi shaxs/rol (masalan: "Boshlovchi", "Jim Rohn", "Nomzod")
   - "emotion": "Neutral" / "Inspiring" / "Serious" / "Energetic"
   - "text": videoda gapirilgan haqiqiy so'zma-so'z gap (asl tilida: inglizcha, ruscha yoki o'zbekcha)
   - "translation": ushbu gapning ${langName}dagi aniq, to'liq va ravon tarjimasi
   Butun video/audio davomiyligini qamrab oluvchi to'liq va batafsil xronologik segmentlar qaytaring!
2. "summary" - TEZKOR XULOSA QISMI:
   Foydalanuvchi butun 1-2 soatlik matnni o'qishga eringan holatda darhol tushunishi uchun, videoning barcha asosiy mavzulari va xulosalarini qamrab oluvchi KENG QAMROVLI, CHUQUR va MUKAMMAL tahliliy xulosa yozing (kamida 3-4 ta to'liq abzas).
3. "transcript" - VIDEODAGI TO'LIQ UZLUKSIZ NUTQ MATNI:
   Videodagi barcha gaplarni daqiqalari bilan to'liq matn shaklida bering.
4. "viral_moments" maydonida videoning eng hayajonli, aforizmli yoki shov-shuvli 3-4 ta Shorts/Reels/TikTok lahzasini bering:
   [
     {
       "start": "01:25",
       "end": "02:10",
       "hook": "Tomoshabinni darhol to'xtatuvchi kuchli zarba sarlavha",
       "reason": "Nega aynan bu joy virusli bo'lishi sababi",
       "quote": "Spiker aytgan eng ta'sirli gap",
       "viral_score": 96,
       "caption": "Instagram Reels va YouTube Shorts uchun tayyor tavsif",
       "hashtags": ["#foydali", "#motivatsiya", "#tahlil"]
     }
   ]
5. "podcast_dialogue" - NOTEBOOKLM AUDIO OVERVIEW USLUBIDAGI 2 TA AI BOSHLОVCHI DIALOGI:
   Materialning asosiy mohiyati va qiziqarli tomonlarini 2 ta boshlovchi (Aziz - qiziquvchan boshlovchi, va Madina - chuqur tahlilchi ekspert) o'rtasidagi xuddi jonli radiopodkastdek erkin, samimiy va oddiy tushunarli dialogi sifatida tuzing (kamida 6-8 ta replika):
   [
     {"speaker": "Aziz", "role": "Boshlovchi", "text": "Salom barchaga! Bugungi materialimizdagi eng muhim g'oya haqida gaplashamiz. Madina, muallif aynan nimani tushuntirmoqchi bo'lgan?"},
     {"speaker": "Madina", "role": "Ekspert", "text": "Salom Aziz! Juda dolzarb mavzu. Bu yerda asosiy e'tibor..."}
   ]
`;

  switch (mode) {
    case 'meeting':
      return `${commonRules}
Siz professional uchrashuv va korporativ boshqaruv tahlilchisisiz.
Quyidagi JSON struktura bo'yicha javob bering:
{
  "headline": "Uchrashuvning asosiy mavzusi",
  "summary": "Uchrashuvning to'liq va keng qamrovli tahliliy xulosasi (kamida 3 ta to'liq abzas)",
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
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:45",
      "speaker": "Spiker 1",
      "emotion": "Neutral",
      "text": "Videoda gapirilgan gap (asl tilda)",
      "translation": "O'zbek tilidagi to'liq tarjimasi"
    }
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
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:45",
      "speaker": "O'qituvchi",
      "emotion": "Neutral",
      "text": "Darsda aytilgan gap (asl tilda)",
      "translation": "O'zbek tilidagi to'liq tarjimasi"
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
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:45",
      "speaker": "Personaj / Boshlovchi",
      "emotion": "Happy",
      "text": "Videoda aytilgan gap (asl tilda)",
      "translation": "O'zbek tilidagi to'liq tarjimasi"
    }
  ],
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
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:45",
      "speaker": "Spiker 1",
      "emotion": "Neutral",
      "text": "Suhbatdagi gap (asl tilda)",
      "translation": "O'zbek tilidagi to'liq tarjimasi"
    }
  ],
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
  "summary": "Taqdimotning umumiy bahosi va notiqning yetkazib bera olish mahorati (kamida 3 ta to'liq abzas)",
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
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:45",
      "speaker": "Notiq",
      "emotion": "Neutral",
      "text": "Taqdimotda aytilgan gap (asl tilda)",
      "translation": "O'zbek tilidagi to'liq tarjimasi"
    }
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
  "summary": "Keng qamrovli, chuqur va xolis tahliliy xulosa (kamida 3 ta to'liq abzas)",
  "sentiment": "Neytral",
  "bias_indicators": ["Bir tomonlama yondashuv yoki emotsional manipulyatsiya belgilari"],
  "key_facts": ["Tasdiqlangan asosiy faktlar"],
  "fact_check": [
    {"claim": "Videoda keltirilgan da'vo", "verdict": "True", "explanation": "Nega bunday baho berilgani", "timestamp": "02:15"}
  ],
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:45",
      "speaker": "Boshlovchi",
      "emotion": "Neutral",
      "text": "Yangilikda aytilgan gap (asl tilda)",
      "translation": "O'zbek tilidagi to'liq tarjimasi"
    }
  ],
  "timestamps": [
    {"time": "00:00", "text": "Yangiliklar blokining boshlanishi"}
  ]
}`;

    case 'audio':
      return `${commonRules}
Siz professional audio tahlilchi, musiqa va nutq muhandisisiz. Ushbu audio faylni (qo'shiq, musiqa trek, suhbat, dars, podkast yoki audio yozuv) to'liq tahlil qiling.
MUHIM TALABLAR:
1. Agar bu qo'shiq yoki musiqa bo'lsa:
   - "audio_timeline" va "transcript"da uning BARCHA so'zlarini (lyrics) kuylangan ketma-ketlikda, vaqt belgilari (start/end) bilan so'zma-so'z to'liq yozing va ${langName}dagi tarjimasini bering.
   - "summary"da qo'shiqning ma'nosi, falsafasi, lirikasi, musiqiy janri, kayfiyati (mood) va ijro mahoratini keng qamrovli tushuntirib bering.
2. Agar bu suhbat, dars yoki nutq bo'lsa:
   - Barcha spikerlarni ajrating (diarizatsiya), ularning har bir gapini audio_timeline va transcriptda so'zma-so'z qoldirmasdan to'liq yozing.
Quyidagi JSON formatda javob bering:
{
  "headline": "Audio yoki qo'shiq nomi, ijrochi / spikerlar",
  "summary": "Audioning umumiy mazmuni, musiqiy uslubi, qo'shiq ma'nosi yoki suhbat xulosasi (kamida 3 ta to'liq abzas)",
  "genre": "Janr (masalan Pop, Hip-Hop, Rock, Maqom, Podkast, Intervyu)",
  "sentiment": "Ijobiy / Romantik / Falsafiy / Energetik / Neytral",
  "transcript": "Audiodagi to'liq so'zlar / qo'shiq matni (lyrics)",
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:20",
      "speaker": "Ijrochi / Spiker",
      "emotion": "Melodic",
      "text": "Kuylangan yoki gapirilgan gap (asl tilda)",
      "translation": "Ushbu qatorning ${langName}dagi to'liq tarjimasi"
    }
  ],
  "timestamps": [
    {"time": "00:00", "text": "Kirish / Intro"}
  ]
}`;

    case 'document':
      return `${commonRules}
Siz professional tahlilchi va hujjatlar ekspertisiz. Ushbu yuklangan PDF hujjatni (kitob, hisobot, ilmiy maqola, shartnoma yoki prezentatsiya) sinchkovlik bilan o'rganib, undagi to'liq matn va mohiyatni tizimli qilib bering.
MUHIM:
1. "transcript" maydonida hujjatdagi barcha asosiy matnlarni, boblar va bo'limlarni to'liq qamrab oluvchi matnni taqdim eting.
2. "audio_timeline" maydonida hujjatning har bir bo'limi yoki sahifasi bo'yicha matn va uning ${langName}dagi tushunarli bayonini bering (foydalanuvchi ovozli o'qitganda eshitishi uchun).
Quyidagi JSON formatda javob bering:
{
  "document_title": "Hujjatning to'liq aniq nomi",
  "summary": "Hujjatning asosiy mohiyati va maqsadi haqida keng qamrovli, chuqur tahliliy xulosa (kamida 3 ta to'liq abzas)",
  "transcript": "Hujjatdagi barcha boblar, bo'limlar va matnlarning to'liq chiqarilgan matni",
  "audio_timeline": [
    {
      "start": "1-sahifa",
      "speaker": "Hujjat matni",
      "emotion": "Neutral",
      "text": "1-sahifa yoki 1-bo'limdagi asosiy matn",
      "translation": "Ushbu qismning ${langName}dagi ravon bayoni"
    }
  ],
  "key_theses": [
    "Asosiy g'oya yoki tezis 1 (sahifa yoki bo'lim ko'rsatilgan holda)",
    "Asosiy g'oya yoki tezis 2"
  ],
  "findings": [
    {"title": "Muhim raqam yoki xulosa", "detail": "Batafsil izoh va uning ma'nosi", "page": "1-sahifa"}
  ],
  "key_facts": [
    "Hujjatdagi tasdiqlangan muhim fakt yoki statistika"
  ],
  "action_items": [
    {"task": "Hujjatdan kelib chiqadigan amaliy qadam yoki tavsiya", "assignee": "Tegishli soha", "deadline": "", "timestamp": "Sahifa 3"}
  ],
  "timestamps": [
    {"time": "1-sahifa", "text": "Hujjat muqaddimasi va kirish"},
    {"time": "Asosiy qism", "text": "Asosiy tahliliy bo'lim"}
  ]
}`;

    default:
      return `${commonRules}
Quyidagi JSON formatda umumlashtirilgan xulosa, to'liq transkript va tahlil bering:
{
  "headline": "Videoning to'liq va aniq sarlavhasi",
  "summary": "Videoning har bir asosiy qismi, ko'rsatilgan platforma amallari, tushuntirishlari va xulosalarini to'liq yorituvchi KENG QAMROVLI, CHUQUR va BATAFSIL tahlil (kamida 3-4 ta to'liq abzas)",
  "agenda": "Mavzular ketma-ketligi va xronologiyasi",
  "key_findings": ["Asosiy xulosalar va muhim parametrlar"],
  "action_items": [{"task": "Vazifa yoki amaliy xulosa", "assignee": "Mas'ul", "deadline": "", "timestamp": "01:00"}],
  "audio_timeline": [
    {
      "start": "00:00",
      "end": "00:30",
      "speaker": "Spiker 1",
      "emotion": "Neutral",
      "text": "Videoda aytilgan to'liq gap (asl tilda: ruscha, inglizcha yoki o'zbekcha)",
      "translation": "Ushbu gapning o'zbek tilidagi to'liq va ravon tarjimasi"
    }
  ],
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
