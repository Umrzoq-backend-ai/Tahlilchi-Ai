'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Sparkles,
  Globe,
  Sliders,
  CheckCircle2,
  Radio,
} from 'lucide-react';

export interface VoiceReaderItem {
  id: number;
  time: string;
  speaker?: string;
  text: string;
  originalText?: string;
}

interface VoiceReaderProps {
  items: VoiceReaderItem[];
  summaryText?: string;
  currentActiveId?: number | null;
  onActiveItemChange?: (id: number | null) => void;
  targetLang?: 'uz' | 'ru' | 'en';
}

export default function VoiceReader({
  items,
  summaryText = '',
  currentActiveId,
  onActiveItemChange,
  targetLang = 'uz',
}: VoiceReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [rate, setRate] = useState<number>(1.0);
  const [voiceLang, setVoiceLang] = useState<'uz' | 'ru' | 'en'>(targetLang);
  const [readingMode, setReadingMode] = useState<'transcript' | 'summary'>('transcript');
  const [textSource, setTextSource] = useState<'translated' | 'original'>('translated');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);

  // Sync refs
  isPlayingRef.current = isPlaying;
  currentIndexRef.current = currentIndex;

  // Initialize SpeechSynthesis and voices
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

  // Update voiceLang if targetLang changes
  useEffect(() => {
    setVoiceLang(targetLang);
  }, [targetLang]);

  // Find best available voice for selected language
  const getSelectedVoice = (lang: 'uz' | 'ru' | 'en'): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) return null;

    if (lang === 'ru') {
      const ruVoice = availableVoices.find(
        (v) => v.lang.startsWith('ru') || v.name.toLowerCase().includes('russian')
      );
      if (ruVoice) return ruVoice;
    } else if (lang === 'en') {
      const enVoice = availableVoices.find(
        (v) =>
          (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en')) &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))
      ) || availableVoices.find((v) => v.lang.startsWith('en'));
      if (enVoice) return enVoice;
    } else if (lang === 'uz') {
      // Look for Uzbek voice, else Turkish, Russian, or default natural voice
      const uzVoice = availableVoices.find(
        (v) => v.lang.startsWith('uz') || v.name.toLowerCase().includes('uzbek')
      );
      if (uzVoice) return uzVoice;

      const trVoice = availableVoices.find(
        (v) => v.lang.startsWith('tr') || v.name.toLowerCase().includes('turkish')
      );
      if (trVoice) return trVoice;

      const ruVoice = availableVoices.find((v) => v.lang.startsWith('ru'));
      if (ruVoice) return ruVoice;
    }

    return availableVoices[0] || null;
  };

  // Prepare text list to speak
  const getTextList = (): VoiceReaderItem[] => {
    if (readingMode === 'summary') {
      if (!summaryText.trim()) return [];
      // Split summary by sentences
      const sentences = summaryText
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      return sentences.map((s, idx) => ({
        id: idx,
        time: `Xulosa ${idx + 1}`,
        speaker: 'AI Xulosa',
        text: s,
        originalText: s,
      }));
    }

    return items;
  };

  const speakItem = (index: number) => {
    const list = getTextList();
    if (!synthRef.current || index >= list.length || index < 0) {
      handleStop();
      return;
    }

    synthRef.current.cancel();

    const currentItem = list[index];
    const textToRead =
      textSource === 'original' && currentItem.originalText
        ? currentItem.originalText
        : currentItem.text;

    if (!textToRead.trim()) {
      // Skip empty line
      speakItem(index + 1);
      return;
    }

    setCurrentIndex(index);
    if (onActiveItemChange) {
      onActiveItemChange(currentItem.id);
    }

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voice = getSelectedVoice(voiceLang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = voiceLang === 'ru' ? 'ru-RU' : voiceLang === 'en' ? 'en-US' : 'tr-TR';
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        if (index + 1 < list.length) {
          speakItem(index + 1);
        } else {
          handleStop();
        }
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (isPlayingRef.current && index + 1 < list.length) {
        speakItem(index + 1);
      } else {
        handleStop();
      }
    };

    synthRef.current.speak(utterance);
  };

  const handlePlay = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    speakItem(currentIndex);
  };

  const handlePause = () => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    if (onActiveItemChange) {
      onActiveItemChange(null);
    }
  };

  const handleNext = () => {
    const list = getTextList();
    if (currentIndex + 1 < list.length) {
      speakItem(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      speakItem(currentIndex - 1);
    }
  };

  const list = getTextList();
  const currentItem = list[currentIndex];
  const progressPercent = list.length > 0 ? Math.round(((currentIndex + 1) / list.length) * 100) : 0;

  return (
    <div className="rounded-3xl p-5 bg-gradient-to-r from-[#0d162d] via-[#091024] to-[#070b1a] border border-cyan-500/30 shadow-2xl space-y-4">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-tight">
                AI Ovozli Tinglash & Dublyaj (Text-to-Speech)
              </h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                Jonli Ovoz
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              O&apos;qishga erinsangiz, istalgan video va transkriptni to&apos;g&apos;ridan-to&apos;g&apos;ri ovozda tinglang
            </p>
          </div>
        </div>

        {/* Reading Source Selector: Transcript vs Summary */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => {
              handleStop();
              setReadingMode('transcript');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              readingMode === 'transcript'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📖 To&apos;liq Nutq ({items.length})
          </button>
          <button
            type="button"
            onClick={() => {
              handleStop();
              setReadingMode('summary');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              readingMode === 'summary'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡️ Tezkor Xulosa
          </button>
        </div>
      </div>

      {/* Main Player Bar: Controls, Speed, Language */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Oldingi gap"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              type="button"
              onClick={handlePause}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pauza</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPaused ? 'Davom ettirish' : 'Ovozda Eshitish'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!isPlaying && !isPaused && currentIndex === 0}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-red-400 transition-all cursor-pointer"
            title="To'xtatish"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex + 1 >= list.length}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Keyingi gap"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed & Language Selection */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Speed Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-bold">
            {[0.8, 1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setRate(s);
                  if (isPlaying) {
                    speakItem(currentIndex);
                  }
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  rate === s
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Voice Language Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setVoiceLang('uz');
                setTextSource('translated');
                if (isPlaying) speakItem(currentIndex);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                voiceLang === 'uz'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇺🇿</span>
              <span>O&apos;zbek</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVoiceLang('ru');
                if (isPlaying) speakItem(currentIndex);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                voiceLang === 'ru'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇷🇺</span>
              <span>Русский</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVoiceLang('en');
                setTextSource('original');
                if (isPlaying) speakItem(currentIndex);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                voiceLang === 'en'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇺🇸</span>
              <span>English</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Current Spoken Sentence Display */}
      {list.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-bold">
                [{currentItem?.time || '00:00'}]
              </span>
              {currentItem?.speaker && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {currentItem.speaker}
                </span>
              )}
              {isPlaying && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  O&apos;qilmoqda...
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {currentIndex + 1} / {list.length} ({progressPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Live Highlighting Card */}
          <div className="p-3 rounded-2xl bg-[#060a16] border border-cyan-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans shadow-inner">
            <p className="whitespace-pre-line">
              <span className="bg-cyan-500/20 text-cyan-200 px-1 py-0.5 rounded font-medium">
                {textSource === 'original' && currentItem?.originalText
                  ? currentItem.originalText
                  : currentItem?.text}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
