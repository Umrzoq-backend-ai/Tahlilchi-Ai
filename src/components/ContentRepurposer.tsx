'use client';

import React, { useState } from 'react';
import {
  Send,
  Mail,
  FileText,
  Copy,
  CheckCircle2,
  Sparkles,
  Share2,
  Download,
  Edit3,
  Layers,
  Quote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ContentRepurposerProps {
  result: AnalysisResponse;
  videoTitle?: string;
  videoUrl?: string | null;
}

type RepurposeFormat = 'telegram' | 'instagram' | 'quotes' | 'linkedin' | 'twitter' | 'memo';

interface CarouselSlide {
  slideNumber: number;
  title: string;
  body: string;
  footer: string;
}

export default function ContentRepurposer({
  result,
  videoTitle,
  videoUrl,
}: ContentRepurposerProps) {
  const [format, setFormat] = useState<RepurposeFormat>('telegram');
  const [copied, setCopied] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedSlide, setCopiedSlide] = useState(false);
  const [editableText, setEditableText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const title = videoTitle || result.metadata?.title || result.headline || 'Tahliliy Material';
  const author = result.metadata?.author || 'Tahlilchi AI';
  const summary = result.summary || '';
  const facts = result.key_facts || [];
  const decisions = result.key_decisions || [];
  const actions = result.action_items || [];
  const takeaways = facts.length > 0 ? facts : decisions.map((d) => d.decision);
  const quotesList = result.audio_timeline?.slice(0, 4) || [];

  // Generate Instagram Carousel 10 slides
  const generateInstagramSlides = (): CarouselSlide[] => {
    return [
      {
        slideNumber: 1,
        title: `🔥 ${title}`,
        body: `90% insonlar e'tibor bermaydigan, ammo hayotiy energiyani so'rib oluvchi eng muhim xulosalar.\n\nSlaydlarni suring va eng kerakli faktlarni bilib oling 👉`,
        footer: `Muallif: ${author} | Tahlilchi AI`,
      },
      {
        slideNumber: 2,
        title: `🛑 1. Asosiy Muammo Nimada?`,
        body: `${summary.slice(0, 220)}...`,
        footer: `Slayd 2/10`,
      },
      {
        slideNumber: 3,
        title: `⚡️ 2. Eng Katta Xato`,
        body: takeaways[0] || `Kun davomida diqqatni birdaniga ko'p narsaga sochish miyani charchatadi va mahsuldorlikni 0 ga tushiradi.`,
        footer: `Slayd 3/10`,
      },
      {
        slideNumber: 4,
        title: `💡 3. Muhim Kashfiyot`,
        body: takeaways[1] || `Kichik, ammo doimiy chalg'ituvchi odatlarni to'xtatish orqali 3 barobar ko'proq natijaga erishish mumkin.`,
        footer: `Slayd 4/10`,
      },
      {
        slideNumber: 5,
        title: `🎯 4. Ekspert Fakti`,
        body: takeaways[2] || `O'z vaqtini qadrlagan va har bir vazifani rejalashtirgan inson charchoqni 80% kamroq his qiladi.`,
        footer: `Slayd 5/10`,
      },
      {
        slideNumber: 6,
        title: `🚀 5. Nima Qilish Kerak?`,
        body: actions[0]?.task || `Vazifalarni tartib bilan bajaring, har bir ishga aniq vaqt ajrating va ortiqcha vazifalarni rad etishni o'rganing.`,
        footer: `Slayd 6/10`,
      },
      {
        slideNumber: 7,
        title: `✅ 6. Amaliy Qadam`,
        body: actions[1]?.task || `Kunlik jadvalingizni soddalashtiring. O'zingiz uchun "fokus vaqti" ajrating.`,
        footer: `Slayd 7/10`,
      },
      {
        slideNumber: 8,
        title: `🔑 7. Oltin Qoida`,
        body: `Energiyangiz — sizning eng qimmatbaho kapitalingiz. Uni arzimagan narsalarga sarflamang.`,
        footer: `Slayd 8/10`,
      },
      {
        slideNumber: 9,
        title: `📊 Xulosa`,
        body: `Ushbu qoidalarni bugunoq qo'llashni boshlang. Natijani 3 kun ichida sezasiz!`,
        footer: `Slayd 9/10`,
      },
      {
        slideNumber: 10,
        title: `💬 Siz Nima Deb O'ylaysiz?`,
        body: `Post sizga foydali bo'ldimi?\n\nFikringizni izohlarda yozib qoldiring, postni saqlab qo'ying va do'stlaringizga ulashing! 🚀`,
        footer: `@tahlilchi_ai • Do'stlarga ulashing`,
      },
    ];
  };

  const slides = generateInstagramSlides();

  // Generate content based on selected format
  const generateContent = (fmt: RepurposeFormat): string => {
    const linkText = videoUrl ? `\n\n🔗 Manba: ${videoUrl}` : '';

    if (fmt === 'telegram') {
      let post = `⚡️ <b>${title}</b>\n\n`;
      post += `📌 <b>Qisqa va aniq xulosa:</b>\n${summary.slice(0, 320)}...\n\n`;
      if (takeaways.length > 0) {
        post += `🔥 <b>Eng muhim faktlar va tezislar:</b>\n`;
        takeaways.slice(0, 4).forEach((item) => {
          post += `▫️ ${item}\n`;
        });
        post += `\n`;
      }
      if (actions.length > 0) {
        post += `✅ <b>Amaliy xulosalar (Nima qilish kerak?):</b>\n`;
        actions.slice(0, 3).forEach((a) => {
          post += `👉 ${a.task}\n`;
        });
        post += `\n`;
      }
      post += `💬 <i>Siz bu borada qanday fikrdasiz? Fikrlaringizni izohlarda yozib qoldiring!</i>\n\n`;
      post += `💡 <i>Tahlilchi AI orqali tayyorlandi</i>${linkText}\n#foydali #tahlil #iqtisodiyot #motivatsiya`;
      return post;
    }

    if (fmt === 'instagram') {
      let carouselText = `📸 INSTAGRAM KARUSEL UCHUN TAYYOR 10 TA SLAYD MATNI:\n==============================================\n\n`;
      slides.forEach((s) => {
        carouselText += `[SLAYD ${s.slideNumber}/10]\n${s.title}\n\n${s.body}\n\n${s.footer}\n----------------------------------------------\n\n`;
      });
      carouselText += `\n#foydali #motivatsiya #reels #karusel #tahlilchiai`;
      return carouselText;
    }

    if (fmt === 'quotes') {
      let qText = `💬 VIDEODAGI ENG ZARBLI IQTIBOSLAR (QUOTES):\n\n`;
      if (quotesList.length > 0) {
        quotesList.forEach((q, idx) => {
          qText += `"${q.translation || q.text}"\n— ${author} [⏱️ ${q.start}]\n\n`;
        });
      } else {
        qText += `"${summary.slice(0, 160)}..."\n— ${author}\n\n`;
        if (takeaways[0]) {
          qText += `"${takeaways[0]}"\n— ${author}\n\n`;
        }
      }
      return qText;
    }

    if (fmt === 'linkedin') {
      let post = `Are you following what's happening with ${title}?\n\n`;
      post += `Here are the 3 biggest takeaways everyone in the industry should know:\n\n`;
      if (takeaways.length > 0) {
        takeaways.slice(0, 3).forEach((item, idx) => {
          post += `${idx + 1}️⃣ ${item}\n\n`;
        });
      } else {
        post += `Key insight:\n${summary}\n\n`;
      }
      post += `💡 The Big Picture:\n${summary.slice(0, 250)}...\n\n`;
      post += `What is your perspective on this? Drop your thoughts below! 👇\n\n`;
      post += `#Leadership #Innovation #IndustryInsights #AI #Analysis${linkText}`;
      return post;
    }

    if (fmt === 'twitter') {
      let thread = `1/4 🧵 Deep dive into "${title}":\n\n${summary.slice(0, 180)}...\n\n👇 Key breakdown:\n\n`;
      if (takeaways[0]) {
        thread += `2/4 📍 Insight #1:\n${takeaways[0].slice(0, 220)}\n\n`;
      }
      if (takeaways[1]) {
        thread += `3/4 📍 Insight #2:\n${takeaways[1].slice(0, 220)}\n\n`;
      }
      thread += `4/4 🎯 Conclusion & Next Steps:\n${
        actions[0]?.task || 'Stay informed and adapt to these fast-moving shifts.'
      }\n\nPowered by @TahlilchiAI${linkText}`;
      return thread;
    }

    if (fmt === 'memo') {
      let memo = `KORPORATIV TAHLILIY MEMORANDUM (EXECUTIVE MEMO)\n`;
      memo += `Kimga: Boshqaruv Kengashi va Rahbariyat\n`;
      memo += `Mavzu: ${title}\n`;
      memo += `Sana: ${new Date().toLocaleDateString('uz-UZ')}\n`;
      memo += `Muallif/Manba: ${author}\n`;
      memo += `--------------------------------------------------\n\n`;
      memo += `1. STRATEGIK XULOSA (EXECUTIVE SUMMARY):\n${summary}\n\n`;
      if (takeaways.length > 0) {
        memo += `2. ASOSIY TAHLILIY FAKTLAR VA RAQAMLAR:\n`;
        takeaways.forEach((t, i) => {
          memo += `   ${i + 1}. ${t}\n`;
        });
        memo += `\n`;
      }
      if (actions.length > 0) {
        memo += `3. TAVSIYA ETILADIGAN HARAKATLAR (ACTION ITEMS):\n`;
        actions.forEach((a, i) => {
          memo += `   - [ ] ${a.task} ${a.assignee ? `(Mas'ul: ${a.assignee})` : ''} ${
            a.deadline ? `(Muddat: ${a.deadline})` : ''
          }\n`;
        });
        memo += `\n`;
      }
      memo += `Hisobot sun'iy intellekt tomonidan video va hujjat tahlili asosida tayyorlandi.`;
      return memo;
    }

    return summary;
  };

  const currentContent = isEditing ? editableText : generateContent(format);

  const handleFormatChange = (newFmt: RepurposeFormat) => {
    setFormat(newFmt);
    setIsEditing(false);
    setEditableText(generateContent(newFmt));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySingleSlide = (slide: CarouselSlide) => {
    const text = `${slide.title}\n\n${slide.body}\n\n${slide.footer}`;
    navigator.clipboard.writeText(text);
    setCopiedSlide(true);
    setTimeout(() => setCopiedSlide(false), 2000);
  };

  const formatButtons = [
    { id: 'telegram' as RepurposeFormat, label: '✈️ Telegram Post', icon: Send, badge: 'Viral' },
    { id: 'instagram' as RepurposeFormat, label: '📸 Instagram Karusel', icon: Layers, badge: '10 Slayd' },
    { id: 'quotes' as RepurposeFormat, label: '💬 Iqtibos Kartochkalari', icon: Quote, badge: 'Quotes' },
    { id: 'linkedin' as RepurposeFormat, label: 'LinkedIn Post', icon: LinkedinIcon },
    { id: 'twitter' as RepurposeFormat, label: 'X / Twitter Thread', icon: TwitterIcon },
    { id: 'memo' as RepurposeFormat, label: 'Executive Memo', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* Format Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {formatButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = format === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => handleFormatChange(btn.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.02]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
              {btn.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 font-mono">
                  {btn.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SPECIAL INTERACTIVE VIEW FOR INSTAGRAM CAROUSEL */}
      {format === 'instagram' && !isEditing && (
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#070b16] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <InstagramIcon className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold text-white">
                Instagram Karusel Visual Slaydlari (1-10)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopySingleSlide(slides[currentSlideIndex])}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                {copiedSlide ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSlide ? 'Slayd nusxalandi!' : `Slayd ${currentSlideIndex + 1} ni nusxalash`}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/30 transition-all"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Barchasi nusxalandi!' : 'Barcha 10 slaydni nusxalash'}</span>
              </button>
            </div>
          </div>

          {/* Slide Visual Card Preview */}
          <div className="max-w-md mx-auto aspect-square sm:aspect-[4/3] rounded-2xl bg-gradient-to-tr from-[#131e36] via-[#0f172a] to-[#1e1336] border border-pink-500/30 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-2xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between text-xs text-pink-300 font-bold">
              <span className="uppercase tracking-wider">Tahlilchi AI Carousel</span>
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30">
                {slides[currentSlideIndex].slideNumber} / 10
              </span>
            </div>

            <div className="my-auto space-y-3 py-4 text-center">
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {slides[currentSlideIndex].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line max-w-sm mx-auto">
                {slides[currentSlideIndex].body}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>{slides[currentSlideIndex].footer}</span>
              <span className="text-pink-400 font-semibold">👉 Suring</span>
            </div>
          </div>

          {/* Slide Navigation Dots & Arrows */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Oldingi</span>
            </button>

            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentSlideIndex === idx ? 'bg-pink-500 scale-125' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={`Slayd ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <span>Keyingi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="relative rounded-2xl bg-[#070b16] border border-slate-800/90 p-5 space-y-3 shadow-inner">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/70 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">
              {format === 'telegram' && 'Telegram Kanal uchun tayyor formatlangan post'}
              {format === 'instagram' && 'Instagram Karusel uchun 10 ta slayd to\'liq matni'}
              {format === 'quotes' && 'Videodagi eng zarbli iqtibos va aforizmlar'}
              {format === 'linkedin' && 'LinkedIn Professional Ekspert Posti (Viral Hook bilan)'}
              {format === 'twitter' && 'X / Twitter uchun 4 qismli Thread (Zanjir)'}
              {format === 'memo' && 'Rahbariyat va Investorlar uchun Rasmiy Memorandum'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditableText(currentContent);
                  setIsEditing(true);
                } else {
                  setIsEditing(false);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'Saqlash' : 'Tahrirlash'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Nusxalandi!' : '1-Click Nusxa'}</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        {isEditing ? (
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={10}
            className="w-full bg-[#050811] text-xs font-mono text-slate-200 p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        ) : (
          <div className="bg-[#050811]/90 rounded-xl p-4 border border-slate-800/80 max-h-[360px] overflow-y-auto">
            <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed select-all">
              {currentContent}
            </pre>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>{currentContent.length} belgi • {currentContent.split(/\s+/).filter(Boolean).length} so'z</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            ✓ Barcha formatlar media va blogerlik standartlariga mos
          </span>
        </div>
      </div>
    </div>
  );
}
