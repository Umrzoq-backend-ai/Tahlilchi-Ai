'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Copy,
  CheckCircle2,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Download,
  Languages,
  FileText,
  Subtitles,
  Sparkles,
  Volume2,
  BookOpen,
  Clock,
  ListFilter,
  Check,
} from 'lucide-react';
import { AnalysisResponse, AudioTimelineItem } from '@/types';

interface SynchronizedTranscriptProps {
  result: AnalysisResponse;
  onSeek?: (timeStr: string) => void;
}

export interface TranscriptLine {
  id: number;
  time: string;
  endTime?: string;
  speaker?: string;
  emotion?: string;
  originalText: string;
  translatedText: string;
}

type TranscriptDisplayMode = 'uzbek' | 'original' | 'parallel';
type TranscriptViewMode = 'article' | 'timeline';
type VoiceLanguage = 'uz' | 'ru' | 'en';
type VoiceGender = 'female' | 'male';

export default function SynchronizedTranscript({
  result,
  onSeek,
}: SynchronizedTranscriptProps) {
  // Parsing all lines from result
  const lines: TranscriptLine[] = useMemo(() => {
    // 1. Primary: Rich audio_timeline with original text and translation
    if (result.audio_timeline && result.audio_timeline.length > 0) {
      return result.audio_timeline.map((item, idx) => ({
        id: idx,
        time: item.start || '00:00',
        endTime: item.end,
        speaker: item.speaker || 'Spiker',
        emotion: item.emotion,
        originalText: item.text || item.translation || '',
        translatedText: item.translation || item.text || '',
      }));
    }

    // 2. Secondary: Raw transcript string with timestamps
    if (result.transcript) {
      const parsed: TranscriptLine[] = [];
      const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?:([^:\n\r]+):\s*)?([^[\n\r]+)/g;
      let match;
      let idx = 0;
      while ((match = regex.exec(result.transcript)) !== null) {
        const time = match[1];
        const speaker = match[2]?.trim() || undefined;
        const text = match[3]?.trim() || '';
        if (text) {
          parsed.push({
            id: idx++,
            time,
            speaker,
            originalText: text,
            translatedText: text,
          });
        }
      }
      if (parsed.length > 0) return parsed;
    }

    // 3. Fallback: result.timestamps
    if (result.timestamps && result.timestamps.length > 0) {
      return result.timestamps.map((t, idx) => ({
        id: idx,
        time: t.time,
        speaker: 'Spiker',
        originalText: t.text,
        translatedText: t.text,
      }));
    }

    // 4. Default fallback
    return [
      {
        id: 0,
        time: '00:00',
        speaker: 'Spiker',
        originalText: result.summary || 'Video boshlanishi',
        translatedText: result.summary || 'Video boshlanishi',
      },
    ];
  }, [result]);

  // View and Display state
  const [viewMode, setViewMode] = useState<TranscriptViewMode>('article');
  const [displayMode, setDisplayMode] = useState<TranscriptDisplayMode>('uzbek');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>('uz');
  const [gender, setGender] = useState<VoiceGender>('female');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const activeLineIdxRef = useRef<number | null>(null);
  const preloadedAudiosRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  isPlayingRef.current = isPlaying;
  activeLineIdxRef.current = activeLineIdx;

  // Text builder for a line
  const getTextForLine = (line: TranscriptLine, lang: VoiceLanguage): string => {
    if (lang === 'uz') {
      return line.translatedText || line.originalText;
    }
    return line.originalText || line.translatedText;
  };

  // URL for TTS
  const getAudioUrl = (text: string, lang: VoiceLanguage, g: VoiceGender, speed: number): string => {
    const rateParam = speed === 1.25 ? '+25%' : speed === 1.5 ? '+50%' : '+0%';
    const clean = encodeURIComponent(text.trim());
    return `/api/tts?text=${clean}&lang=${lang}&gender=${g}&rate=${encodeURIComponent(rateParam)}`;
  };

  // Preload next line audio
  const preloadNext = (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= lines.length) return;
    const nextLine = lines[nextIdx];
    const text = getTextForLine(nextLine, voiceLang);
    if (!text) return;
    const url = getAudioUrl(text, voiceLang, gender, playbackSpeed);

    if (!preloadedAudiosRef.current.has(nextIdx)) {
      const a = new Audio();
      a.preload = 'auto';
      a.src = url;
      preloadedAudiosRef.current.set(nextIdx, a);
    }
  };

  // Stop audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIdx !== null) {
      const el = document.getElementById(`transcript-line-${activeLineIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeLineIdx]);

  // Play line
  const playLine = async (idx: number) => {
    if (idx < 0 || idx >= lines.length) {
      stopAudio();
      setActiveLineIdx(null);
      return;
    }

    const line = lines[idx];
    const textToSpeak = getTextForLine(line, voiceLang);

    if (!textToSpeak.trim()) {
      playLine(idx + 1);
      return;
    }

    setActiveLineIdx(idx);
    setIsPlaying(true);
    setIsLoadingAudio(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = getAudioUrl(textToSpeak, voiceLang, gender, playbackSpeed);
    const audio = preloadedAudiosRef.current.get(idx) || new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;

    audio.oncanplay = () => {
      setIsLoadingAudio(false);
    };

    audio.onended = () => {
      if (isPlayingRef.current) {
        playLine(idx + 1);
      }
    };

    audio.onerror = (e) => {
      console.warn(`[TTS Player] Audio playback error on line ${idx}:`, e);
      setIsLoadingAudio(false);
      if (isPlayingRef.current && idx + 1 < lines.length) {
        setTimeout(() => playLine(idx + 1), 600);
      } else {
        stopAudio();
      }
    };

    try {
      await audio.play();
      setIsLoadingAudio(false);
      preloadNext(idx + 1);
    } catch (playErr) {
      console.warn('[TTS Player] Autoplay interrupted:', playErr);
      setIsLoadingAudio(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current && audioRef.current.src && activeLineIdx !== null) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        playLine(activeLineIdx !== null ? activeLineIdx : 0);
      }
    }
  };

  const handleNextLine = () => {
    const nextIdx = (activeLineIdx ?? -1) + 1;
    if (nextIdx < lines.length) {
      playLine(nextIdx);
    }
  };

  const handlePrevLine = () => {
    const prevIdx = (activeLineIdx ?? 1) - 1;
    if (prevIdx >= 0) {
      playLine(prevIdx);
    }
  };

  const handleLanguageChange = (newLang: VoiceLanguage) => {
    setVoiceLang(newLang);
    preloadedAudiosRef.current.clear();
    if (isPlaying && activeLineIdx !== null) {
      setTimeout(() => playLine(activeLineIdx), 50);
    }
  };

  const handleGenderChange = (newGender: VoiceGender) => {
    setGender(newGender);
    preloadedAudiosRef.current.clear();
    if (isPlaying && activeLineIdx !== null) {
      setTimeout(() => playLine(activeLineIdx), 50);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // FULL TEXT COPY: Copies 100% of speech from 00:00 to the end
  const handleCopyAll = () => {
    const fullText = lines
      .map((l) => {
        const text =
          displayMode === 'original'
            ? l.originalText
            : displayMode === 'parallel'
            ? `[Asl]: "${l.originalText}"\n[O'zbekcha]: "${l.translatedText}"`
            : l.translatedText;
        return `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}${text}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Single quote copy
  const handleCopyQuote = (line: TranscriptLine, idx: number) => {
    const textToCopy =
      displayMode === 'original'
        ? line.originalText
        : displayMode === 'parallel'
        ? `[Asl]: "${line.originalText}"\n[O'zbekcha]: "${line.translatedText}"`
        : line.translatedText;

    navigator.clipboard.writeText(`[${line.time}] ${line.speaker ? `${line.speaker}: ` : ''}${textToCopy}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    const fullText = lines
      .map((l) => {
        const text = displayMode === 'original' ? l.originalText : l.translatedText;
        return `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}${text}`;
      })
      .join('\n\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tahlilchi_videoning_toliq_matni_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download SRT
  const handleDownloadSrt = () => {
    const formatSrtTime = (timeStr: string, isEnd = false) => {
      const parts = timeStr.replace(/[\[\]]/g, '').trim().split(':').map((p) => parseInt(p, 10));
      let totalSec = 0;
      if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];
      if (isEnd) totalSec += 4;

      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},000`;
    };

    let srtContent = '';
    lines.forEach((l, i) => {
      const startTime = formatSrtTime(l.time, false);
      const endTime = l.endTime ? formatSrtTime(l.endTime, false) : formatSrtTime(l.time, true);
      const text = displayMode === 'original' ? l.originalText : l.translatedText;
      srtContent += `${i + 1}\n${startTime} --> ${endTime}\n${l.speaker ? `${l.speaker}: ` : ''}${text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitr_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter lines by search
  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) return lines;
    const q = searchQuery.toLowerCase();
    return lines.filter(
      (l) =>
        l.translatedText.toLowerCase().includes(q) ||
        l.originalText.toLowerCase().includes(q) ||
        l.time.includes(q) ||
        l.speaker?.toLowerCase().includes(q)
    );
  }, [lines, searchQuery]);

  const activeLine = activeLineIdx !== null && lines[activeLineIdx] ? lines[activeLineIdx] : null;
  const progressPercent = activeLineIdx !== null ? Math.round(((activeLineIdx + 1) / lines.length) * 100) : 0;

  // Approximate total words in transcript
  const totalWords = useMemo(() => {
    return lines.reduce((acc, l) => acc + (l.translatedText.split(/\s+/).length || 0), 0);
  }, [lines]);

  return (
    <div className="space-y-5">
      {/* ================= DISTINCT STANDOUT CARD FOR FULL SPOKEN TEXT ================= */}
      <div className="relative rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-[#0c1838] via-[#09122c] to-[#050a18] border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/40 space-y-5 transition-all">
        
        {/* Glow corner accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ================= 1. HEADER STRIP WITH BIG PROMINENT COPY BUTTON ================= */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Videoda Gapirilgan To&apos;liq Matn</span>
              </span>
              <span className="text-xs font-mono text-slate-300 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80">
                ⏱️ 00:00 dan oxirigacha ({lines.length} ta gap / ~{totalWords.toLocaleString()} so&apos;z)
              </span>
              <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                ✓ So&apos;zma-so&apos;z to&apos;liq nutq
              </span>
            </div>

            <h3 className="text-base sm:text-xl font-black text-white leading-tight">
              Videodagi Har Bir Gap va Spikerlar Nutqi
            </h3>
            <p className="text-xs text-slate-300">
              1-2 soatlik video bo&apos;lsa ham, unda aytilgan barcha fikrlar tartib bilan to&apos;liq chiqarilgan. Bitta tugma bilan nusxalashingiz yoki ovozda tinglashingiz mumkin.
            </p>
          </div>

          {/* PROMINENT TOP ACTION BUTTONS: BIG COPY BUTTON */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleCopyAll}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-xl cursor-pointer ${
                copiedAll
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 scale-105'
                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black shadow-cyan-500/30 hover:scale-105'
              }`}
              title="Videodagi barcha gaplarni bitta klikda nusxalash"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>To&apos;liq Matn Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Hammasini Nusxalash</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all cursor-pointer shadow-md"
              title=".TXT fayl qilib saqlash"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>.TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSrt}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer shadow-md"
              title="Subtitr (.SRT) formatida yuklab olish"
            >
              <Subtitles className="w-4 h-4 text-cyan-400" />
              <span>.SRT Subtitr</span>
            </button>
          </div>
        </div>

        {/* ================= 2. MASTER AUDIO PLAYER (100% TABIIY INSON OVOZI) ================= */}
        <div className="relative z-10 p-4 rounded-2xl bg-[#060c1c]/90 border border-cyan-500/30 space-y-3.5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <span>Jonli Ovozda Tinglash & Dublyaj</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                    Neural AI Voice
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Matnni o&apos;qishga erinsangiz, istalgan tilda sof ravon inson ovozida eshiting
                </span>
              </div>
            </div>

            {/* Language Selection for Voice */}
            <div className="flex items-center gap-1 p-1 bg-[#030611] rounded-2xl border border-slate-800 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleLanguageChange('uz')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceLang === 'uz'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇺🇿 O&apos;zbek</span>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('ru')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceLang === 'ru'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇷🇺 Русский</span>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  voiceLang === 'en'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇬🇧 English</span>
              </button>
            </div>
          </div>

          {/* Master Player Controls Strip */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevLine}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="Oldingi gap"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                    : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black shadow-cyan-500/30'
                }`}
              >
                {isLoadingAudio ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Yuklanmoqda...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>To&apos;xtatish</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ovozda Tinglash</span>
                  </>
                )}
              </button>

              {isPlaying && (
                <button
                  type="button"
                  onClick={stopAudio}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                  title="Butunlay to'xtatish"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNextLine}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="Keyingi gap"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* Gender selector */}
              <div className="flex items-center gap-1 p-1 bg-[#030611] rounded-xl border border-slate-800 ml-1">
                <button
                  type="button"
                  onClick={() => handleGenderChange('female')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    gender === 'female'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Madina (Ayol)"
                >
                  <span>👩 Madina</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('male')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    gender === 'male'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sardor (Erkak)"
                >
                  <span>👨 Sardor</span>
                </button>
              </div>

              {/* Speed selector */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-[#030611] rounded-xl border border-slate-800 ml-1">
                {[1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      playbackSpeed === spd
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Currently playing sentence tracker */}
            <div className="flex-1 min-w-0 bg-[#030611] rounded-xl p-2.5 border border-slate-800/90 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-cyan-400 font-bold flex items-center gap-2 truncate">
                  {activeLine ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                      <span>[{activeLine.time}]</span>
                      {activeLine.speaker && (
                        <span className="text-slate-300 uppercase tracking-wider text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">
                          {activeLine.speaker}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400">Pleer tayyor — «Ovozda Tinglash» tugmasini bosing</span>
                  )}
                </span>

                <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-2">
                  {activeLineIdx !== null ? `${activeLineIdx + 1} / ${lines.length} (${progressPercent}%)` : `${lines.length} ta gap`}
                </span>
              </div>

              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. VIEW MODE & LANGUAGE STRIP ================= */}
        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#070e22] border border-cyan-500/20">
          {/* Switch: Article Reading Mode vs Timeline Segments */}
          <div className="flex items-center gap-1.5 p-1 bg-[#040816] rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('article')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'article'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📖 Yaxlit Matn (O&apos;qish Rejimi)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>⏱ Daqiqama-daqiqa (Segmentlar)</span>
            </button>
          </div>

          {/* Text Display Language */}
          <div className="flex items-center gap-1 p-1 bg-[#040816] rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setDisplayMode('uzbek')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === 'uzbek'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇺🇿 O&apos;zbekcha</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('original')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === 'original'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐 Asl Til</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('parallel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayMode === 'parallel'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔄 Parallel</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Videodan so'z yoki gap qidirish..."
              className="w-full bg-[#040816] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* ================= 4. CONTENT DISPLAY (ARTICLE OR TIMELINE) ================= */}
        {viewMode === 'article' ? (
          /* ================= A. YAXLIT MATN / ARTICLE MODE (00:00 dan oxirigacha) ================= */
          <div className="relative z-10 p-5 sm:p-7 rounded-2xl bg-[#050a18]/90 border border-cyan-500/25 max-h-[640px] overflow-y-auto space-y-4 shadow-inner">
            {filteredLines.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                &ldquo;{searchQuery}&rdquo; bo&apos;yicha hech qanday gap topilmadi.
              </div>
            ) : (
              filteredLines.map((line) => {
                const isLineActive = activeLineIdx === line.id;
                const displayText =
                  displayMode === 'original'
                    ? line.originalText
                    : line.translatedText;

                return (
                  <div
                    key={line.id}
                    id={`transcript-line-${line.id}`}
                    className={`p-3.5 rounded-2xl transition-all border ${
                      isLineActive
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'border-transparent hover:border-slate-800/80 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => onSeek && onSeek(line.time)}
                        className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 px-2 py-0.5 rounded-md cursor-pointer transition-all hover:scale-105"
                        title="Videoni shu joyidan boshlash"
                      >
                        [{line.time}]
                      </button>

                      {line.speaker && (
                        <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                          {line.speaker}:
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => playLine(line.id)}
                        className="text-slate-400 hover:text-cyan-300 ml-auto cursor-pointer p-1"
                        title="Ovozda tinglash"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${isLineActive ? 'text-cyan-400 animate-bounce' : ''}`} />
                      </button>
                    </div>

                    {displayMode === 'parallel' ? (
                      <div className="space-y-1.5 pl-2 border-l-2 border-slate-700">
                        <p className="text-xs text-slate-400 italic">
                          {highlightMatch(line.originalText, searchQuery)}
                        </p>
                        <p className="text-sm text-slate-100 font-sans font-medium leading-relaxed">
                          {highlightMatch(line.translatedText, searchQuery)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-100 font-sans font-medium leading-relaxed select-text">
                        {highlightMatch(displayText, searchQuery)}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ================= B. DAQIQAMA-DAQIQA TIMELINE SEGMENTS ================= */
          <div className="relative z-10 rounded-2xl border border-cyan-500/25 bg-[#050a18]/90 divide-y divide-slate-800/80 max-h-[640px] overflow-y-auto p-2 sm:p-3 space-y-1 shadow-inner">
            {filteredLines.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                &ldquo;{searchQuery}&rdquo; bo&apos;yicha hech qanday gap topilmadi.
              </div>
            ) : (
              filteredLines.map((line, idx) => {
                const isLineActive = activeLineIdx === line.id;
                return (
                  <div
                    key={line.id}
                    id={`transcript-line-${line.id}`}
                    className={`p-3 sm:p-4 rounded-2xl transition-all group flex items-start justify-between gap-3 border ${
                      isLineActive
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'hover:bg-slate-900/60 border-transparent hover:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSeek && onSeek(line.time)}
                        className="timestamp-chip shrink-0 font-mono text-[11px] font-bold bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 cursor-pointer"
                        title="Videoni shu vaqtdan ko'rish"
                      >
                        <Play className="w-2.5 h-2.5 fill-current text-cyan-400" />
                        <span>
                          {line.time}
                          {line.endTime ? ` - ${line.endTime}` : ''}
                        </span>
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {line.speaker && (
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60">
                              {line.speaker}
                            </span>
                          )}
                          {line.emotion && (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              ({line.emotion})
                            </span>
                          )}
                          {isLineActive && (
                            <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1.5 animate-pulse bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span>O&apos;qilmoqda</span>
                            </span>
                          )}
                        </div>

                        {displayMode === 'uzbek' && (
                          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans select-text">
                            {highlightMatch(line.translatedText, searchQuery)}
                          </p>
                        )}

                        {displayMode === 'original' && (
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans select-text italic">
                            {highlightMatch(line.originalText, searchQuery)}
                          </p>
                        )}

                        {displayMode === 'parallel' && (
                          <div className="space-y-2 pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                              <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider block mb-0.5">
                                Asl tildagi nutq:
                              </span>
                              {highlightMatch(line.originalText, searchQuery)}
                            </div>
                            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs sm:text-sm text-blue-100 leading-relaxed font-medium">
                              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block mb-0.5">
                                O&apos;zbekcha tarjimasi:
                              </span>
                              {highlightMatch(line.translatedText, searchQuery)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => playLine(line.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isLineActive
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/40'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-400'
                        }`}
                        title="Ushbu gapdan boshlab ovozda tinglash"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${isLineActive ? 'animate-bounce' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyQuote(line, idx)}
                        className="opacity-70 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                        title="Ushbu gapdan nusxa olish"
                      >
                        {copiedIdx === idx ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Bottom helper footnote */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-cyan-500/20 gap-2">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>«Hammasini Nusxalash» tugmasi videodagi 00:00 dan oxirigacha bo&apos;lgan to&apos;liq nutqni saqlab beradi.</span>
          </span>
          <span className="font-semibold text-slate-300">
            1-2 Soatlik To&apos;liq Audio Transkript & Dublyaj
          </span>
        </div>
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
