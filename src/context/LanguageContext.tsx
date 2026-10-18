'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'uz' | 'ru';

interface Translations {
  nav: {
    home: string;
    analyzer: string;
    history: string;
    about: string;
    settings: string;
  };
  hero: {
    badge: string;
    title1: string;
    titleHighlight: string;
    subtitle: string;
    launch: string;
    seeHow: string;
  };
  analyzer: {
    tabVideo: string;
    tabYoutube: string;
    tabAudio: string;
    dropVideo: string;
    dropAudio: string;
    dropSubVideo: string;
    dropSubAudio: string;
    youtubePlaceholder: string;
    youtubeHelper: string;
    modeTitle: string;
    outputLang: string;
    enableTranscript: string;
    batchMode: string;
    analyzeBtn: string;
    analyzing: string;
    modes: {
      meeting: { name: string; desc: string };
      news: { name: string; desc: string };
      education: { name: string; desc: string };
      child: { name: string; desc: string };
      interview: { name: string; desc: string };
      pitch: { name: string; desc: string };
      chat: { name: string; desc: string };
    };
  };
  history: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allModes: string;
    clear: string;
    tokenFilter: string;
    emptyTitle: string;
    emptySub: string;
  };
  about: {
    title: string;
    highlight: string;
    subtitle: string;
    missionTitle: string;
    missionDesc: string;
    techTitle: string;
    techDesc: string;
    creatorTitle: string;
    creatorRole: string;
    creatorDesc: string;
  };
  settings: {
    title: string;
    subtitle: string;
    apiKeyLabel: string;
    getKey: string;
    apiKeyPlaceholder: string;
    modelLabel: string;
    viewPricing: string;
    modelNote: string;
    billingTitle: string;
    billingDesc: string;
    back: string;
    save: string;
    saved: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      analyzer: 'Analyzer',
      history: 'History',
      about: 'About',
      settings: 'Settings',
    },
    hero: {
      badge: 'Quanta AI • Powered by Gemini',
      title1: 'Unlock the Intelligence in ',
      titleHighlight: 'Every Frame',
      subtitle:
        'Transform raw video footage into clarity. From corporate meetings to educational content, Quanta extracts the signal from the noise instantly.',
      launch: 'Launch Studio',
      seeHow: 'See How It Works',
    },
    analyzer: {
      tabVideo: 'VIDEO UPLOAD',
      tabYoutube: 'YOUTUBE URL',
      tabAudio: 'AUDIO UPLOAD',
      dropVideo: 'Click to upload or drag video here',
      dropAudio: 'Click to upload or drag audio here',
      dropSubVideo: 'MP4, WEBM, MOV (max 1GB)',
      dropSubAudio: 'MP3, WAV, M4A, OGG, FLAC (max 200MB)',
      youtubePlaceholder: 'Paste YouTube video URL here...',
      youtubeHelper: 'Direct video and transcript stream powered by Gemini',
      modeTitle: 'ANALYSIS MODE',
      outputLang: 'OUTPUT LANGUAGE',
      enableTranscript: 'ENABLE TRANSCRIPT',
      batchMode: 'BATCH MODE',
      analyzeBtn: 'Analyze Video',
      analyzing: 'Analyzing Video Frames & Audio...',
      modes: {
        meeting: { name: 'MEETING RECORDING', desc: 'Decisions, tasks, and speakers' },
        news: { name: 'NEWS REPORT', desc: 'Fact-checking, sentiment, and bias' },
        education: { name: 'EDUCATIONAL CONTENT', desc: 'Summary, concepts, and interactive quiz' },
        child: { name: 'CHILD CONTENT REVIEW', desc: '1-16 age rating and safety warnings' },
        interview: { name: 'INTERVIEW ANALYSIS', desc: 'Scorecard, tech skills, and verdict' },
        pitch: { name: 'PITCH ANALYSIS', desc: '3V Framework: Verbal, Visual, Vocal' },
        chat: { name: 'VIDEO CHAT', desc: 'Direct conversational Q&A with timestamps' },
      },
    },
    history: {
      title: 'History',
      subtitle: 'Your past analyses',
      searchPlaceholder: 'Search...',
      allModes: 'All Modes',
      clear: 'Clear',
      tokenFilter: 'TOKEN FILTER:',
      emptyTitle: 'No history yet',
      emptySub: 'Analyze a video to get started',
    },
    about: {
      title: 'About ',
      highlight: 'Quanta',
      subtitle: 'Bridging the gap between raw video footage and actionable human intelligence.',
      missionTitle: 'The Mission',
      missionDesc:
        'We live in a world overflowing with video content. Quanta was built to solve this latency of information. By using multimodal AI, we instantly transform linear video into structured, searchable, and interactive knowledge.',
      techTitle: 'The Technology',
      techDesc:
        "Powered by Google's Gemini, Quanta utilizes a massive context window to process video frames and audio tracks simultaneously, allowing it to understand visual context unlike text-only models.",
      creatorTitle: 'AI Engineering Team',
      creatorRole: 'Multimodal AI Architecture',
      creatorDesc:
        'Dedicated to democratizing access to cutting-edge multimodal intelligence and building real-world implementations of models like Gemini 2.5 and Gemini 3.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Your key is stored locally in your browser.',
      apiKeyLabel: 'GEMINI API KEY',
      getKey: 'Get a key here',
      apiKeyPlaceholder: 'Paste your API key here',
      modelLabel: 'AI MODEL',
      viewPricing: 'View Pricing',
      modelNote: 'Selected model will be used for all analyses. Some models may have rate limits.',
      billingTitle: 'Billing Disclaimer',
      billingDesc:
        'Usage will be charged from your own Google Gemini API quota according to your active billing plan. Ensure your account is properly configured at ai.google.dev.',
      back: '← Back',
      save: 'Save Configuration',
      saved: 'Configuration Saved!',
    },
  },
  uz: {
    nav: {
      home: 'Bosh sahifa',
      analyzer: 'Studiya (Analyzer)',
      history: 'Tarix',
      about: 'Loyiha haqida',
      settings: 'Sozlamalar',
    },
    hero: {
      badge: 'Quanta AI • Gemini texnologiyasida',
      title1: 'Har bir kadrdagi ',
      titleHighlight: 'Aql va Zakovat',
      subtitle:
        'Xom videoni amaliy tushunchalarga aylantiring. Yig‘ilishlardan tortib darslargacha, Quanta videoni bir zumda tizimli bilimga aylantiradi.',
      launch: 'Studiyani Ochish',
      seeHow: 'Qanday Ishlashini Ko‘rish',
    },
    analyzer: {
      tabVideo: 'VIDEO YUKLASH',
      tabYoutube: 'YOUTUBE HAVOLA',
      tabAudio: 'AUDIO YUKLASH',
      dropVideo: 'Videoni yuklash uchun bosing yoki shu yerga tashlang',
      dropAudio: 'Audioni yuklash uchun bosing yoki shu yerga tashlang',
      dropSubVideo: 'MP4, WEBM, MOV (maks 1GB)',
      dropSubAudio: 'MP3, WAV, M4A, OGG, FLAC (maks 200MB)',
      youtubePlaceholder: 'YouTube video havolasini bu yerga joylashtiring...',
      youtubeHelper: 'Gemini multimodal modeli orqali to‘g‘ridan-to‘g‘ri tahlil',
      modeTitle: 'TAHLIL REJIMI',
      outputLang: 'NATIJA TILI',
      enableTranscript: 'TRANSKRIPTNI YOQISH',
      batchMode: 'OMMAVIY REJIM',
      analyzeBtn: 'Videoni Tahlil Qilish',
      analyzing: 'AI videoni kadrma-kadr tahlil qilmoqda...',
      modes: {
        meeting: { name: 'UCHRASHUV YOZUVLARI', desc: 'Qarorlar, vazifalar va spikerlar' },
        news: { name: 'YANGILIKLAR VA MEDIA', desc: 'Faktlar tekshiruvi va manipulyatsiya' },
        education: { name: 'TA’LIM VA DARS KONSEPTI', desc: 'Dars konspekti va interaktiv test' },
        child: { name: 'BOLALAR XAVFSIZLIGI', desc: '1-16 yosh xavfsizlik filtri' },
        interview: { name: 'INTERVYU VA HR BAHOSI', desc: 'Nomzod bilimi va moslik bali' },
        pitch: { name: 'NOTIQLIK VA TAQDIMOT (3V)', desc: 'Verbal, Vizual va Vokal tahlil' },
        chat: { name: 'VIDEO BILAN CHAT', desc: 'Vaqt belgilari bilan jonli savol-javob' },
      },
    },
    history: {
      title: 'Tahlillar Tarixi',
      subtitle: 'Sizning avvalgi tahlillaringiz',
      searchPlaceholder: 'Qidirish...',
      allModes: 'Barcha rejimlar',
      clear: 'Tozalash',
      tokenFilter: 'TOKEN FILTER:',
      emptyTitle: 'Tarix hali bo‘sh',
      emptySub: 'Boshlash uchun birinchi videongizni tahlil qiling',
    },
    about: {
      title: 'Loyiha ',
      highlight: 'Haqida',
      subtitle: 'Xom video ma’lumotlarini inson uchun tushunarli aqlga aylantiramiz.',
      missionTitle: 'Missiya',
      missionDesc:
        'Biz video kontentga to‘la dunyoda yashayapmiz. Quanta axborotni uzoq kutish kechikishini yo‘q qilish uchun yaratilgan. Multimodal AI yordamida biz videoni bir zumda tizimli bilimga aylantiramiz.',
      techTitle: 'Texnologiya',
      techDesc:
        'Google Gemini tomonidan quvvatlangan Quanta, video kadrlar va audio treklarni bir vaqtning o‘zida qayta ishlash uchun ulkan kontekst oynasidan foydalanadi.',
      creatorTitle: 'AI Muhandislar Jamoasi',
      creatorRole: 'Multimodal AI Arxitekturasi',
      creatorDesc:
        'Ilg‘or sun’iy intellekt vositalarini hamma uchun qulay qilish va Gemini kabi multimodal modellarni amaliyotga tatbiq etish ustida ishlaydi.',
    },
    settings: {
      title: 'Sozlamalar',
      subtitle: 'API kalitingiz faqat brauzeringiz xotirasida saqlanadi.',
      apiKeyLabel: 'GEMINI API KALITI',
      getKey: 'Kalitni bu yerdan oling',
      apiKeyPlaceholder: 'API kalitingizni shu yerga qo‘ying',
      modelLabel: 'AI MODELI',
      viewPricing: 'Narxlarni ko‘rish',
      modelNote: 'Tanlangan model barcha tahlillar uchun ishlatiladi.',
      billingTitle: 'To‘lov va Hisob-kitob',
      billingDesc:
        'Foydalanish shaxsiy Google Gemini API kvotangizdan yechiladi. Hisobingiz ai.google.dev da sozlanganligiga ishonch hosil qiling.',
      back: '← Orqaga',
      save: 'Sozlamalarni Saqlash',
      saved: 'Muvaffaqiyatli Saqlandi!',
    },
  },
  ru: {
    nav: {
      home: 'Главная',
      analyzer: 'Студия (Analyzer)',
      history: 'История',
      about: 'О проекте',
      settings: 'Настройки',
    },
    hero: {
      badge: 'Quanta AI • На базе Gemini',
      title1: 'Интеллект в ',
      titleHighlight: 'Каждом Кадре',
      subtitle:
        'Превращайте сырое видео в четкие выводы. От корпоративных встреч до обучающих курсов — Quanta мгновенно извлекает суть из шума.',
      launch: 'Запустить Студию',
      seeHow: 'Как это работает',
    },
    analyzer: {
      tabVideo: 'ЗАГРУЗИТЬ ВИДЕО',
      tabYoutube: 'YOUTUBE ССЫЛКА',
      tabAudio: 'ЗАГРУЗИТЬ АУДИО',
      dropVideo: 'Нажмите для загрузки или перетащите видео',
      dropAudio: 'Нажмите для загрузки или перетащите аудио',
      dropSubVideo: 'MP4, WEBM, MOV (макс. 1ГБ)',
      dropSubAudio: 'MP3, WAV, M4A, OGG, FLAC (макс. 200МБ)',
      youtubePlaceholder: 'Вставьте ссылку на YouTube видео...',
      youtubeHelper: 'Прямой мультимодальный анализ через Gemini',
      modeTitle: 'РЕЖИМ АНАЛИЗА',
      outputLang: 'ЯЗЫК РЕЗУЛЬТАТА',
      enableTranscript: 'ВКЛЮЧИТЬ ТРАНСКРИПТ',
      batchMode: 'ПАКЕТНЫЙ РЕЖИМ',
      analyzeBtn: 'Анализировать Видео',
      analyzing: 'ИИ анализирует видеокадры и звук...',
      modes: {
        meeting: { name: 'ЗАПИСЬ ВСТРЕЧИ', desc: 'Решения, задачи и спикеры' },
        news: { name: 'НОВОСТИ И ФАКТЫ', desc: 'Проверка фактов и тональность' },
        education: { name: 'ОБУЧАЮЩИЙ КОНТЕНТ', desc: 'Конспект и интерактивный тест' },
        child: { name: 'ДЕТСКАЯ БЕЗОПАСНОСТЬ', desc: 'Оценка контента для детей 1-16 лет' },
        interview: { name: 'АНАЛИЗ ИНТЕРВЬЮ', desc: 'Оценка навыков кандидата и вердикт' },
        pitch: { name: 'АНАЛИЗ ПРЕЗЕНТАЦИИ (3V)', desc: 'Вербальный, визуальный и вокальный' },
        chat: { name: 'ЧАТ С ВИДЕО', desc: 'Вопросы и ответы с таймкодами' },
      },
    },
    history: {
      title: 'История',
      subtitle: 'Ваши предыдущие анализы',
      searchPlaceholder: 'Поиск...',
      allModes: 'Все режимы',
      clear: 'Очистить',
      tokenFilter: 'ФИЛЬТР ТОКЕНОВ:',
      emptyTitle: 'История пуста',
      emptySub: 'Проанализируйте видео, чтобы начать',
    },
    about: {
      title: 'О проекте ',
      highlight: 'Quanta',
      subtitle: 'Превращаем сырые видеоматериалы в структурированные человеческие знания.',
      missionTitle: 'Миссия',
      missionDesc:
        'Мы живем в мире, перегруженном видеоконтентом. Quanta создана для устранения задержки восприятия информации.',
      techTitle: 'Технологии',
      techDesc:
        'Quanta использует возможности модели Google Gemini с контекстным окном до 2 миллионов токенов.',
      creatorTitle: 'Команда AI инженеров',
      creatorRole: 'Мультимодальная Архитектура',
      creatorDesc: 'Создание инновационных пользовательских интерфейсов для работы с Gemini.',
    },
    settings: {
      title: 'Настройки',
      subtitle: 'Ваш ключ хранится локально в браузере.',
      apiKeyLabel: 'API КЛЮЧ GEMINI',
      getKey: 'Получить ключ здесь',
      apiKeyPlaceholder: 'Вставьте ваш API ключ сюда',
      modelLabel: 'МОДЕЛЬ ИИ',
      viewPricing: 'Тарифы',
      modelNote: 'Выбранная модель будет использоваться для всех анализов.',
      billingTitle: 'Примечание об оплате',
      billingDesc:
        'Использование тарифицируется по квоте вашего Google аккаунта в соответствии с тарифами Google Gemini API.',
      back: '← Назад',
      save: 'Сохранить Конфигурацию',
      saved: 'Конфигурация сохранена!',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('quanta_lang') as Language;
    if (saved && (saved === 'en' || saved === 'uz' || saved === 'ru')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('quanta_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
