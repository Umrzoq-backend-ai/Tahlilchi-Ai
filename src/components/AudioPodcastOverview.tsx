'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Headphones,
  User,
  Users,
} from 'lucide-react';
import { PodcastDialogueItem, AnalysisResponse } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface AudioPodcastOverviewProps {
  result: AnalysisResponse;
}

export default function AudioPodcastOverview({ result }: AudioPodcastOverviewProps) {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [rate, setRate] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isPlayingRef = useRef(false);
  const activeIndexRef = useRef(0);

  isPlayingRef.current = isPlaying;
  activeIndexRef.current = activeIndex;

  // Initialize SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        setAvailableVoices(voices);
      };

      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Prepare podcast dialogue lines (with smart fallback if AI hasn't returned dialogue array)
  const dialogueLines: PodcastDialogueItem[] = useMemo(() => {
    if (result.podcast_dialogue && result.podcast_dialogue.length > 0) {
      return result.podcast_dialogue;
    }

    // Auto-generate conversational script from summary & key points
    const summary = result.summary || '';
    const sentences = summary
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const title = result.metadata?.title || result.headline || 'Ushbu mavzu';

    if (sentences.length === 0) {
      return [
        {
          speaker: 'Aziz',
          role: 'Boshlovchi',
          text: `Salom! Bugun biz "${title}" mavzusidagi materialni batafsil ko'rib chiqamiz.`,
        },
        {
          speaker: 'Madina',
          role: 'Ekspert',
          text: `Salom Aziz! Haqiqatan ham ushbu materialda ko'plab muhim va qiziqarli jihatlar yoritilgan.`,
        },
      ];
    }

    const script: PodcastDialogueItem[] = [
      {
        speaker: 'Aziz',
        role: 'Boshlovchi',
        text: `Salom barchaga! "Tahlilchi AI Podkast"iga xush kelibsiz. Bugun biz "${title}" bo'yicha eng muhim xulosalarni birgalikda tahlil qilamiz. Madina, ushbu material sizda qanday taassurot qoldirdi?`,
      },
      {
        speaker: 'Madina',
        role: 'Ekspert',
        text: `Salom Aziz! Juda qiziqarli kontent. Eng asosiy mohiyatidan boshlaydigan bo'lsak: ${sentences[0] || ''}`,
      },
    ];

    if (sentences[1]) {
      script.push({
        speaker: 'Aziz',
        role: 'Boshlovchi',
        text: `Aynan! Muallif nima uchun bunga alohida urg'u bergan deb o'ylaysiz?`,
      });
      script.push({
        speaker: 'Madina',
        role: 'Ekspert',
        text: `Chunki bu yerda asosiy masala ochib berilgan: ${sentences[1]}`,
      });
    }

    if (sentences[2]) {
      script.push({
        speaker: 'Aziz',
        role: 'Boshlovchi',
        text: `Qoyil! Tomoshabinlar va foydalanuvchilar bundan o'zlariga qanday amaliy xulosa chiqarishlari mumkin?`,
      });
      script.push({
        speaker: 'Madina',
        role: 'Ekspert',
        text: `${sentences[2]} Mana shuning o'zi ushbu materialning qanchalik dolzarb ekanligini isbotlaydi.`,
      });
    }

    script.push({
      speaker: 'Aziz',
      role: 'Boshlovchi',
      text: `Ajoyib tushuntirish bo'ldi, Madina! Do'stlar, to'liq transkript va xulosalarni platformamizda batafsil o'qishingiz mumkin. E'tiboringiz uchun rahmat!`,
    });

    return script;
  }, [result]);

  // Voice picker for Host (Male) vs Expert (Female)
  const getHostVoice = (isFemale: boolean): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) return null;

    if (isFemale) {
      // Prefer female-sounding voice
      const female = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('svetlana') ||
          v.name.toLowerCase().includes('anna')
      );
      if (female) return female;
    } else {
      // Prefer male-sounding voice
      const male = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('dmitry') ||
          v.name.toLowerCase().includes('pavel')
      );
      if (male) return male;
    }

    return availableVoices[0] || null;
  };

  const speakLine = (index: number) => {
    if (!synthRef.current || index >= dialogueLines.length || index < 0) {
      handleStop();
      return;
    }

    synthRef.current.cancel();
    const line = dialogueLines[index];
    setActiveIndex(index);

    // Scroll into view
    const el = document.getElementById(`podcast-line-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.rate = rate;

    // Pitch distinction between male and female host
    const isFemale = line.speaker.toLowerCase().includes('madina');
    utterance.pitch = isFemale ? 1.25 : 0.95;

    const voice = getHostVoice(isFemale);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR';
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        if (index + 1 < dialogueLines.length) {
          speakLine(index + 1);
        } else {
          handleStop();
        }
      }
    };

    utterance.onerror = (e) => {
      console.warn('Podcast speech synthesis warning:', e);
      if (isPlayingRef.current && index + 1 < dialogueLines.length) {
        speakLine(index + 1);
      } else {
        handleStop();
      }
    };

    synthRef.current.speak(utterance);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    speakLine(activeIndex);
  };

  const handlePause = () => {
    if (synthRef.current) {
      synthRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleResume = () => {
    if (synthRef.current && synthRef.current.paused) {
      synthRef.current.resume();
      setIsPlaying(true);
    } else {
      handlePlay();
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setActiveIndex(0);
  };

  const handleNext = () => {
    if (activeIndex + 1 < dialogueLines.length) {
      const next = activeIndex + 1;
      setActiveIndex(next);
      if (isPlaying) speakLine(next);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      const prev = activeIndex - 1;
      setActiveIndex(prev);
      if (isPlaying) speakLine(prev);
    }
  };

  const currentSpeaker = dialogueLines[activeIndex]?.speaker || 'Aziz';
  const isMadinaSpeaking = currentSpeaker.toLowerCase().includes('madina');

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0c1326] via-[#090e1d] to-[#070b18] border border-cyan-500/30 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative Podcast Waves in Background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
              <Headphones className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-white tracking-tight">
                {language === 'en'
                  ? 'AI Deep Dive Podcast'
                  : language === 'ru'
                  ? 'ИИ Дип-Дайв Подкаст'
                  : "AI Deep Dive Podkast"}
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm shadow-rose-500/20 animate-pulse">
                NotebookLM Uslubida
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'en'
                ? '2 AI hosts (Aziz & Madina) break down this material in a lively audio conversation'
                : language === 'ru'
                ? '2 ИИ ведущих (Азиз и Мадина) живо обсуждают материал в формате диалога'
                : "2 ta AI boshlovchi (Aziz va Madina) ushbu materialni jonli suhbat tarzida tushuntiradi"}
            </p>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#060a14] p-1 rounded-xl border border-slate-800 self-end sm:self-auto">
          {[0.8, 1.0, 1.25, 1.5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRate(s)}
              className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                rate === s
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic 2-Host Studio Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Host 1: Aziz */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
            !isMadinaSpeaking && isPlaying
              ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
              : 'bg-[#080d1a]/80 border-slate-800/80 opacity-80'
          }`}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              Aziz
            </div>
            {!isMadinaSpeaking && isPlaying && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#080d1a] animate-ping" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Aziz</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                Boshlovchi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {!isMadinaSpeaking && isPlaying ? "Hozir gapirmoqda..." : "Kuzatuvchi va savol beruvchi"}
            </p>
          </div>
        </div>

        {/* Host 2: Madina */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
            isMadinaSpeaking && isPlaying
              ? 'bg-pink-600/15 border-pink-500 shadow-lg shadow-pink-500/10'
              : 'bg-[#080d1a]/80 border-slate-800/80 opacity-80'
          }`}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              Madina
            </div>
            {isMadinaSpeaking && isPlaying && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-400 border-2 border-[#080d1a] animate-ping" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Madina</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                Tahlilchi Ekspert
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {isMadinaSpeaking && isPlaying ? "Hozir gapirmoqda..." : "Chuqur tahlil qiluvchi"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Podcast Player Controls */}
      <div className="p-4 rounded-2xl bg-[#060a15] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
            title="Oldingi replika"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{language === 'en' ? 'Start AI Podcast' : language === 'ru' ? 'Слушать подкаст' : 'Podkastni Tinglash'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>{language === 'en' ? 'Pause' : language === 'ru' ? 'Пауза' : "To'xtatish"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex + 1 >= dialogueLines.length}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
            title="Keyingi replika"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleStop}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Boshiga qaytarish"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress & Live Equalizer */}
        <div className="flex items-center gap-3">
          {isPlaying && (
            <div className="flex items-center gap-1 h-4">
              <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-blue-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-5" />
              <span className="w-1 bg-pink-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
              <span className="w-1 bg-cyan-300 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2" />
            </div>
          )}

          <span className="text-xs font-mono text-slate-400 font-semibold">
            {activeIndex + 1} / {dialogueLines.length} replika
          </span>
        </div>
      </div>

      {/* Conversational Script (Interactive Chat-Like View) */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {dialogueLines.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isMadina = line.speaker.toLowerCase().includes('madina');

          return (
            <div
              key={idx}
              id={`podcast-line-${idx}`}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-xs flex items-start gap-3.5 ${
                isActive
                  ? isMadina
                    ? 'bg-pink-950/30 border-pink-500 shadow-md shadow-pink-500/10 text-white'
                    : 'bg-blue-950/30 border-cyan-500 shadow-md shadow-cyan-500/10 text-white'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isMadina
                    ? 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white'
                }`}
              >
                {line.speaker[0]}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold ${
                      isMadina ? 'text-pink-300' : 'text-cyan-300'
                    }`}
                  >
                    {line.speaker} ({line.role || (isMadina ? 'Ekspert' : 'Boshlovchi')}):
                  </span>

                  <button
                    type="button"
                    onClick={() => speakLine(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Shu gapni eshitish"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="leading-relaxed whitespace-pre-line text-slate-200">
                  {line.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
