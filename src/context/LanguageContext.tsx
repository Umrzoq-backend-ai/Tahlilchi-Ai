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
    trustNoAccount: string;
    trustFree: string;
    trustTranscript: string;
  };
  home: {
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    featuresBadge: string;
    featuresTitle: string;
    featuresDesc: string;
    openMode: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaBtn: string;
    ctaTrust1: string;
    ctaTrust2: string;
    ctaTrust3: string;
  };
  analyzer: {
    tabVideo: string;
    tabYoutube: string;
    tabAudio: string;
    tabPdf: string;
    dropVideo: string;
    dropAudio: string;
    dropPdf: string;
    dropSubVideo: string;
    dropSubAudio: string;
    dropSubPdf: string;
    youtubePlaceholder: string;
    youtubeHelper: string;
    modeTitle: string;
    outputLang: string;
    enableTranscript: string;
    batchMode: string;
    analyzeBtn: string;
    analyzing: string;
    selectVideo: string;
    selectAudio: string;
    selectPdf: string;
    changeMedia: string;
    youtubeTitle: string;
    loadVideo: string;
    trySample: string;
    modesAvailable: string;
    reportTab: string;
    chatTab: string;
    tokensUsed: string;
    targetChildAge: string;
    targetRoleLabel: string;
    seniorityLabel: string;
    tabDossier: string;
    tabViral: string;
    tabRepurpose: string;
    tabTranscript: string;
    tabTimeline: string;
    tabExport: string;
    timeSaved: string;
    summaryTitle: string;
    timestampsTitle: string;
    loading1: string;
    loading2: string;
    loading3: string;
    loading4: string;
    largeVideoNote: string;
    modes: {
      meeting: { name: string; desc: string; badge: string };
      news: { name: string; desc: string; badge: string };
      education: { name: string; desc: string; badge: string };
      child: { name: string; desc: string; badge: string };
      interview: { name: string; desc: string; badge: string };
      pitch: { name: string; desc: string; badge: string };
      chat: { name: string; desc: string; badge: string };
      document: { name: string; desc: string; badge: string };
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
  footer: {
    desc: string;
    quickLinks: string;
    capabilities: string;
    privacy: string;
    noAccount: string;
    security: string;
    rights: string;
    madeIn: string;
    statusOnline: string;
    geminiArchitecture: string;
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
      badge: '✨ No Account Required • 100% Instant AI Analysis',
      title1: 'Skip Hours of Watching Videos — ',
      titleHighlight: 'Instant Intelligence with Multimodal AI',
      subtitle:
        'No sign-up or credit card required. Paste any YouTube link, video, audio note, or PDF to extract executive summaries, clickable timestamps, and complete transcripts in seconds.',
      launch: 'Launch Studio for Free',
      seeHow: 'See How It Works',
      trustNoAccount: 'No Account Required',
      trustFree: '100% Free & Open',
      trustTranscript: 'Full Transcript & Timestamps',
    },
    home: {
      step1Title: '1. Video, Audio & PDF',
      step1Desc: 'Paste a YouTube URL, MP4 video, audio file, or PDF document.',
      step2Title: '2. Native Multimodal AI',
      step2Desc: 'Gemini understands video frames, audio tracks, and slides simultaneously.',
      step3Title: '3. Actionable Intelligence',
      step3Desc: 'Decisions, interactive quiz, 3V pitch review, and conversational Video Chat.',
      featuresBadge: 'Specialized Domains',
      featuresTitle: '7 Specialized Analysis Modes',
      featuresDesc: 'Domain-specific structured JSON output schemas and tailored multimodal prompts.',
      openMode: 'Open Mode',
      ctaTitle: 'Ready to instantly analyze any media?',
      ctaDesc: 'No sign-up or credit card required! Paste any link or upload a file — get a complete breakdown and transcript in seconds.',
      ctaBtn: 'Open Studio for Free',
      ctaTrust1: 'No registration',
      ctaTrust2: '100% Free & Secure',
      ctaTrust3: 'Instant results',
    },
    analyzer: {
      tabVideo: 'VIDEO UPLOAD',
      tabYoutube: 'YOUTUBE URL',
      tabAudio: 'AUDIO UPLOAD',
      tabPdf: 'PDF DOCUMENT',
      dropVideo: 'Click to upload or drag video here',
      dropAudio: 'Click to upload or drag audio here',
      dropPdf: 'Click to upload or drag PDF document here',
      dropSubVideo: 'MP4, WEBM, MOV (max 1GB)',
      dropSubAudio: 'MP3, WAV, M4A, OGG, FLAC (max 200MB)',
      dropSubPdf: 'Books, reports, slides, and papers (max 50MB)',
      youtubePlaceholder: 'Paste YouTube video URL here...',
      youtubeHelper: 'Direct video and transcript stream powered by Gemini',
      modeTitle: 'ANALYSIS MODE',
      outputLang: 'OUTPUT LANGUAGE',
      enableTranscript: 'ENABLE TRANSCRIPT',
      batchMode: 'BATCH MODE',
      analyzeBtn: 'Analyze Content',
      analyzing: 'Analyzing Video, Audio & Documents...',
      selectVideo: 'Select Video',
      selectAudio: 'Select Audio',
      selectPdf: 'Select PDF Document',
      changeMedia: 'Change Media',
      youtubeTitle: 'YouTube Stream Streamer',
      loadVideo: 'Load Video',
      trySample: 'Try Sample Video:',
      modesAvailable: '7 Modes Available',
      reportTab: 'Analysis Report',
      chatTab: 'Interactive Video Chat',
      tokensUsed: 'tokens used',
      targetChildAge: 'Target Child Age',
      targetRoleLabel: 'Target Role',
      seniorityLabel: 'Seniority Level',
      tabDossier: 'Analytical Dossier',
      tabViral: 'Viral Shorts & Reels',
      tabRepurpose: 'SMM & Business Repurposing',
      tabTranscript: 'Synchronized Transcript',
      tabTimeline: 'Visual Timeline',
      tabExport: 'Share & Export',
      timeSaved: 'Time Saved',
      summaryTitle: 'Executive Summary',
      timestampsTitle: 'Interactive Timestamps',
      loading1: "1/3: Preparing frames and audio for multimodal AI...",
      loading2: "2/3: Streaming to Gemini multimodal model...",
      loading3: "3/3: AI is analyzing video, speech, and events...",
      loading4: "Generating structured findings, fact-checks, and timestamps...",
      largeVideoNote: "💡 Large videos (100MB+) are optimized for AI processing and analyzed in seconds.",
      modes: {
        meeting: { name: 'MEETING RECORDING', desc: 'Decisions, tasks, and speakers', badge: 'Business' },
        news: { name: 'NEWS & FACT-CHECK', desc: 'Fact-checking, sentiment, and bias', badge: 'Facts' },
        education: { name: 'EDUCATIONAL CONTENT', desc: 'Summary, concepts, and interactive quiz', badge: 'Test & Quiz' },
        child: { name: 'CHILD CONTENT REVIEW', desc: '1-16 age rating and safety warnings', badge: '1-16 Age' },
        interview: { name: 'INTERVIEW ANALYSIS', desc: 'Scorecard, tech skills, and verdict', badge: 'HR Rating' },
        pitch: { name: 'PITCH ANALYSIS', desc: '3V Framework: Verbal, Visual, Vocal', badge: '3V Speech' },
        chat: { name: 'INTERACTIVE CHAT', desc: 'Direct conversational Q&A with timestamps', badge: 'Video Chat' },
        document: { name: 'PDF & DOCUMENT ANALYSIS', desc: 'Executive summaries, data, and takeaways', badge: 'PDF / Document' },
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
      emptySub: 'Analyze a video or PDF to get started',
    },
    about: {
      title: 'About ',
      highlight: 'Tahlilchi AI',
      subtitle: 'Bridging the gap between rich media content and actionable human intelligence.',
      missionTitle: 'The Mission',
      missionDesc:
        'We live in a world overflowing with video content. Tahlilchi AI was built to solve this latency of information. By using multimodal AI, we instantly transform linear video into structured, searchable, and interactive knowledge.',
      techTitle: 'The Technology',
      techDesc:
        "Powered by Google's Gemini, Tahlilchi AI utilizes a massive context window to process video frames and audio tracks simultaneously, allowing it to understand visual context unlike text-only models.",
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
      billingTitle: '100% Free & Unlimited Access',
      billingDesc:
        'Google AI Studio provides generous free quota every month without requiring any credit card or billing account. Your chosen model is saved locally and used for all video and media analysis.',
      back: '← Back',
      save: 'Save Configuration',
      saved: 'Configuration Saved!',
    },
    footer: {
      desc: 'The next-generation multimodal AI intelligence platform developed in Uzbekistan. Extract actionable decisions, timestamps, and full transcripts from any media instantly.',
      quickLinks: 'Platform',
      capabilities: 'Capabilities',
      privacy: 'Security & Trust',
      noAccount: 'No Sign-Up Required',
      security: '100% Private & Locally Stored',
      rights: '© 2026 Tahlilchi AI. All rights reserved.',
      madeIn: 'Crafted with care in Uzbekistan 🇺🇿',
      statusOnline: 'Systems fully operational (Online)',
      geminiArchitecture: 'Powered by Google Gemini 2.5 & 3 Native Multimodal architecture.',
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
      badge: '✨ Ro‘yxatdan o‘tish shart emas • 100% Ochiq AI Platforma',
      title1: 'Videolarni soatlab ko‘rish shart emas — ',
      titleHighlight: 'AI Bilan 1 Soniyada To‘liq Tahlil',
      subtitle:
        'Akkaunt ochish yoki karta kiritish talab qilinmaydi! Istalgan YouTube video, audio yozuv yoki PDF hujjatni kiriting — Tahlilchi AI eng muhim xulosalar, daqiqama-daqiqa vaqt belgilari (timestamps) va to‘liq o‘zbekcha transkriptni darhol ajratib beradi.',
      launch: 'Studiyani Bepul Boshlash',
      seeHow: 'Qanday Ishlashini Ko‘rish',
      trustNoAccount: 'Akkaunt kiritish shart emas',
      trustFree: '100% Bepul & Ochiq',
      trustTranscript: 'To‘liq Transkript & Timestamps',
    },
    home: {
      step1Title: '1. Video, Audio & PDF',
      step1Desc: 'YouTube URL, MP4 video, audio yoki PDF hujjatni kiritasiz.',
      step2Title: '2. Native Multimodal AI',
      step2Desc: 'Gemini video kadrlar, audiotrek va slaydlarni bir vaqtda tushunadi.',
      step3Title: '3. Actionable Intelligence',
      step3Desc: 'Qarorlar, interaktiv test, 3V tahlil va suhbatdosh Video Chat.',
      featuresBadge: 'Ixtisoslashgan Yo‘nalishlar',
      featuresTitle: '7 xil ixtisoslashgan tahlil rejimlari',
      featuresDesc: 'Har bir soha uchun maxsus tuzilgan JSON structured output schemalari va AI modellari.',
      openMode: 'Rejimni ochish',
      ctaTitle: 'Ixtiyoriy videoni darhol tahlil qilishga tayyormisiz?',
      ctaDesc: 'Akkaunt ochish yoki karta kiritish talab qilinmaydi! Havolani joylang yoki faylni yuklang — soniyalar ichida to‘liq tahlil va transkriptga ega bo‘ling.',
      ctaBtn: 'Studiyani Bepul Ochish',
      ctaTrust1: 'Ro‘yxatdan o‘tishsiz',
      ctaTrust2: '100% Bepul va xavfsiz',
      ctaTrust3: 'Daqiqalik natija',
    },
    analyzer: {
      tabVideo: 'VIDEO YUKLASH',
      tabYoutube: 'YOUTUBE HAVOLA',
      tabAudio: 'AUDIO YUKLASH',
      tabPdf: 'PDF HUJJAT',
      dropVideo: 'Videoni yuklash uchun bosing yoki shu yerga tashlang',
      dropAudio: 'Audioni yuklash uchun bosing yoki shu yerga tashlang',
      dropPdf: 'PDF hujjatni yuklash uchun bosing yoki shu yerga tashlang',
      dropSubVideo: 'MP4, WEBM, MOV (maks 1GB)',
      dropSubAudio: 'MP3, WAV, M4A, OGG, FLAC (maks 200MB)',
      dropSubPdf: 'Kitoblar, hisobotlar, taqdimotlar va ilmiy maqolalar (maks 50MB)',
      youtubePlaceholder: 'YouTube video havolasini bu yerga joylashtiring...',
      youtubeHelper: 'Gemini multimodal modeli orqali to‘g‘ridan-to‘g‘ri tahlil',
      modeTitle: 'TAHLIL REJIMI',
      outputLang: 'NATIJA TILI',
      enableTranscript: 'TRANSKRIPTNI YOQISH',
      batchMode: 'OMMAVIY REJIM',
      analyzeBtn: 'Kontentni Tahlil Qilish',
      analyzing: 'AI video, audio va hujjatlarni tahlil qilmoqda...',
      selectVideo: 'Videoni Tanlash',
      selectAudio: 'Audioni Tanlash',
      selectPdf: 'PDF Hujjatni Tanlash',
      changeMedia: 'Faylni o‘zgartirish',
      youtubeTitle: 'YouTube Stream Tahlili',
      loadVideo: 'Yuklash',
      trySample: 'Namunaviy video:',
      modesAvailable: '7 Xil Rejim Mavjud',
      reportTab: 'Tahliliy Hisobot',
      chatTab: 'Interaktiv Video Chat',
      tokensUsed: 'token ishlatildi',
      targetChildAge: 'Bola yoshi',
      targetRoleLabel: 'Kandidat lavozimi',
      seniorityLabel: 'Tajriba darajasi',
      tabDossier: 'Tahliliy Dosye',
      tabViral: 'Viral Shorts & Reels',
      tabRepurpose: 'SMM & Biznes Repurposing',
      tabTranscript: 'Sinxron Transkript',
      tabTimeline: 'Vizual Xronologiya',
      tabExport: 'Ulashish & Chop Etish',
      timeSaved: 'Tejalgan Vaqt',
      summaryTitle: 'Asosiy Xulosa',
      timestampsTitle: 'Interaktiv Vaqt Belgilari',
      loading1: "1/3: Kadrlar va audio sun'iy intellekt uchun tayyorlanmoqda...",
      loading2: "2/3: Multimodal Gemini modeliga uzatilmoqda...",
      loading3: "3/3: Sun'iy intellekt video, nutq va voqealarni tahlil qilmoqda...",
      loading4: "Tizimli xulosalar, fakt-tekshiruv va vaqt belgilari shakllanmoqda...",
      largeVideoNote: "💡 Katta videolar (100MB+) sun'iy intellekt uchun maxsus tezlashtirilib, bir necha soniyada tahlil qilinadi.",
      modes: {
        meeting: { name: 'UCHRASHUV YOZUVLARI', desc: 'Qarorlar, vazifalar va spikerlar', badge: 'Biznes' },
        news: { name: 'YANGILIKLAR & FAKT-CHEK', desc: 'Faktlar tekshiruvi va xolislik', badge: 'Faktlar' },
        education: { name: 'TA’LIM VA DARS KONSEPTI', desc: 'Dars konspekti va interaktiv test', badge: 'Test & Quiz' },
        child: { name: 'BOLALAR XAVFSIZLIGI', desc: '1-16 yosh xavfsizlik filtri', badge: '1-16 Yosh' },
        interview: { name: 'INTERVYU VA HR BAHOSI', desc: 'Nomzod bilimi va moslik bali', badge: 'HR Baho' },
        pitch: { name: 'NOTIQLIK VA TAQDIMOT (3V)', desc: 'Verbal, Vizual va Vokal tahlil', badge: '3V Nutq' },
        chat: { name: 'INTERAKTIV CHAT', desc: 'Vaqt belgilari bilan jonli savol-javob', badge: 'Video Chat' },
        document: { name: 'PDF & HUJJAT TAHLILI', desc: 'Kitob, hisobot va maqolalardan xulosalar', badge: 'PDF / Hujjat' },
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
      emptySub: 'Boshlash uchun birinchi videongiz yoki PDFingizni tahlil qiling',
    },
    about: {
      title: 'Loyiha ',
      highlight: 'Tahlilchi AI',
      subtitle: 'Katta hajmdagi video, audio va PDF hujjatlarni daqiqalar ichida inson uchun eng qulay va aniq bilimga aylantiramiz.',
      missionTitle: 'Missiya',
      missionDesc:
        'Biz video kontentga to‘la dunyoda yashayapmiz. Tahlilchi AI axborotni uzoq kutish kechikishini yo‘q qilish uchun yaratilgan. Multimodal AI yordamida biz videoni bir zumda tizimli bilimga aylantiramiz.',
      techTitle: 'Texnologiya',
      techDesc:
        'Google Gemini tomonidan quvvatlangan Tahlilchi AI, video kadrlar va audio treklarni bir vaqtning o‘zida qayta ishlash uchun ulkan kontekst oynasidan foydalanadi.',
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
      billingTitle: 'Mutlaqo Bepul va Cheksiz Foydalanish',
      billingDesc:
        'Google AI Studio har bir foydalanuvchiga oyiga bepul limit beradi (karta yoki to‘lov mutlaqo talab qilinmaydi). Tanlagan modelingiz avtomatik saqlanadi va videolarni tahlil qilishda ishlatiladi.',
      back: '← Orqaga',
      save: 'Sozlamalarni Saqlash',
      saved: 'Muvaffaqiyatli Saqlandi!',
    },
    footer: {
      desc: 'O‘zbekistonda ishlab chiqilgan birinchi milliy multimodal AI tahlil platformasi. Video, audio yozuv va PDF hujjatlardan soniyalar ichida amaliy bilim va to‘liq transkript oling.',
      quickLinks: 'Platforma',
      capabilities: 'Imkoniyatlar',
      privacy: 'Xavfsizlik & Afzallik',
      noAccount: 'Akkaunt ochish shart emas',
      security: '100% Maxfiy va Lokal saqlanadi',
      rights: '© 2026 Tahlilchi AI. Barcha huquqlar himoyalangan.',
      madeIn: 'O‘zbekistonda mehr bilan ishlab chiqilgan 🇺🇿',
      statusOnline: 'Tizim barqaror ishlamoqda (Online)',
      geminiArchitecture: 'Google Gemini 2.5 & 3 Native Multimodal arxitekturasi asosida ishlaydi.',
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
      badge: '✨ Без регистрации и аккаунтов • 100% Мгновенный ИИ-анализ',
      title1: 'Не тратьте часы на просмотр видео — ',
      titleHighlight: 'Полный анализ за 1 секунду с ИИ',
      subtitle:
        'Без регистрации и привязки карт. Вставьте ссылку на YouTube, загрузите видео, аудио или PDF — получайте главные выводы, таймкоды и полный транскрипт за считанные секунды.',
      launch: 'Открыть Студию Бесплатно',
      seeHow: 'Как это работает',
      trustNoAccount: 'Без регистрации',
      trustFree: '100% Бесплатно и открыто',
      trustTranscript: 'Полный транскрипт и таймкоды',
    },
    home: {
      step1Title: '1. Видео, Аудио и PDF',
      step1Desc: 'Вставьте ссылку YouTube, загрузите видео MP4, аудио или PDF документ.',
      step2Title: '2. Мультимодальный ИИ',
      step2Desc: 'Gemini анализирует видеокадры, аудиодорожки и слайды одновременно.',
      step3Title: '3. Готовые знания',
      step3Desc: 'Решения, интерактивный тест, 3V оценка и диалоговый видеочат.',
      featuresBadge: 'Специализированные направления',
      featuresTitle: '7 специализированных режимов анализа',
      featuresDesc: 'Специализированные схемы вывода JSON и оптимизированные промпты под каждую задачу.',
      openMode: 'Открыть режим',
      ctaTitle: 'Готовы проанализировать любое видео?',
      ctaDesc: 'Без регистрации и привязки карт. Вставьте ссылку или загрузите файл — получите полный анализ и транскрипт за секунды.',
      ctaBtn: 'Открыть Студию Бесплатно',
      ctaTrust1: 'Без регистрации',
      ctaTrust2: '100% Бесплатно и безопасно',
      ctaTrust3: 'Мгновенный результат',
    },
    analyzer: {
      tabVideo: 'ЗАГРУЗИТЬ ВИДЕО',
      tabYoutube: 'YOUTUBE ССЫЛКА',
      tabAudio: 'ЗАГРУЗИТЬ АУДИО',
      tabPdf: 'PDF ДОКУМЕНТ',
      dropVideo: 'Нажмите для загрузки или перетащите видео',
      dropAudio: 'Нажмите для загрузки или перетащите аудио',
      dropPdf: 'Нажмите для загрузки или перетащите PDF документ',
      dropSubVideo: 'MP4, WEBM, MOV (макс. 1ГБ)',
      dropSubAudio: 'MP3, WAV, M4A, OGG, FLAC (макс. 200МБ)',
      dropSubPdf: 'Книги, отчеты, презентации и статьи (макс. 50МБ)',
      youtubePlaceholder: 'Вставьте ссылку на YouTube видео...',
      youtubeHelper: 'Прямой мультимодальный анализ через Gemini',
      modeTitle: 'РЕЖИМ АНАЛИЗА',
      outputLang: 'ЯЗЫК РЕЗУЛЬТАТА',
      enableTranscript: 'ВКЛЮЧИТЬ ТРАНСКРИПТ',
      batchMode: 'ПАКЕТНЫЙ РЕЖИМ',
      analyzeBtn: 'Анализировать Контент',
      analyzing: 'ИИ анализирует видео, звук и документы...',
      selectVideo: 'Выбрать видео',
      selectAudio: 'Выбрать аудио',
      selectPdf: 'Выбрать PDF документ',
      changeMedia: 'Сменить файл',
      youtubeTitle: 'Анализ YouTube видео',
      loadVideo: 'Загрузить',
      trySample: 'Пример видео:',
      modesAvailable: 'Доступно 7 режимов',
      reportTab: 'Аналитический отчет',
      chatTab: 'Интерактивный видеочат',
      tokensUsed: 'токенов использовано',
      targetChildAge: 'Возраст ребенка',
      targetRoleLabel: 'Должность кандидата',
      seniorityLabel: 'Уровень опыта',
      tabDossier: 'Аналитическое досье',
      tabViral: 'Вирусные Shorts & Reels',
      tabRepurpose: 'SMM и переработка контента',
      tabTranscript: 'Синхронный транскрипт',
      tabTimeline: 'Визуальная хронология',
      tabExport: 'Поделиться и экспорт',
      timeSaved: 'Сэкономлено времени',
      summaryTitle: 'Главный вывод',
      timestampsTitle: 'Интерактивные таймкоды',
      loading1: "1/3: Подготовка кадров и аудио для мультимодального ИИ...",
      loading2: "2/3: Передача данных в мультимодальную модель Gemini...",
      loading3: "3/3: ИИ анализирует видео, речь и происходящее...",
      loading4: "Формирование структурированных выводов, фактов и таймкодов...",
      largeVideoNote: "💡 Большие видео (100MB+) оптимизируются для ИИ и анализируются за несколько секунд.",
      modes: {
        meeting: { name: 'ЗАПИСЬ ВСТРЕЧИ', desc: 'Решения, задачи и спикеры', badge: 'Бизнес' },
        news: { name: 'НОВОСТИ И ФАКТЫ', desc: 'Проверка фактов и тональность', badge: 'Факты' },
        education: { name: 'ОБУЧАЮЩИЙ КОНТЕНТ', desc: 'Конспект и интерактивный тест', badge: 'Тест и квиз' },
        child: { name: 'ДЕТСКАЯ БЕЗОПАСНОСТЬ', desc: 'Оценка контента для детей 1-16 лет', badge: '1-16 Лет' },
        interview: { name: 'АНАЛИЗ ИНТЕРВЬЮ', desc: 'Оценка навыков кандидата и вердикт', badge: 'HR Оценка' },
        pitch: { name: 'АНАЛИЗ ПРЕЗЕНТАЦИИ (3V)', desc: 'Вербальный, визуальный и вокальный', badge: '3V Речь' },
        chat: { name: 'ИНТЕРАКТИВНЫЙ ЧАТ', desc: 'Вопросы и ответы с таймкодами', badge: 'Видеочат' },
        document: { name: 'АНАЛИЗ PDF И ДОКУМЕНТОВ', desc: 'Ключевые тезисы, факты и выводы', badge: 'PDF / Документ' },
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
      emptySub: 'Проанализируйте видео или PDF, чтобы начать',
    },
    about: {
      title: 'О проекте ',
      highlight: 'Tahlilchi AI',
      subtitle: 'Превращаем объемные видеоматериалы и документы в понятные структурированные знания.',
      missionTitle: 'Миссия',
      missionDesc:
        'Мы живем в мире, перегруженном видеоконтентом. Tahlilchi AI создана для устранения задержки восприятия информации.',
      techTitle: 'Технологии',
      techDesc:
        'Tahlilchi AI использует возможности модели Google Gemini с контекстным окном до 2 миллионов токенов.',
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
      billingTitle: 'Бесплатный и неограниченный доступ',
      billingDesc:
        'Google AI Studio предоставляет щедрую бесплатную квоту каждый месяц без необходимости привязывать банковскую карту. Выбранная модель сохраняется локально и используется для анализа видео и документов.',
      back: '← Назад',
      save: 'Сохранить Конфигурацию',
      saved: 'Конфигурация сохранена!',
    },
    footer: {
      desc: 'Первая национальная платформа мультимодального ИИ-анализа, созданная в Узбекистане. Мгновенное извлечение сути, таймкодов и транскриптов из видео, аудио и PDF.',
      quickLinks: 'Платформа',
      capabilities: 'Возможности',
      privacy: 'Безопасность',
      noAccount: 'Без регистрации',
      security: '100% конфиденциально',
      rights: '© 2026 Tahlilchi AI. Все права защищены.',
      madeIn: 'Сделано с заботой в Узбекистане 🇺🇿',
      statusOnline: 'Системы работают штатно (Online)',
      geminiArchitecture: 'Работает на базе архитектуры Google Gemini 2.5 & 3 Native Multimodal.',
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
