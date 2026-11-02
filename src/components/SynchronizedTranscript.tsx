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
  VolumeX,
  User,
  Radio,
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
type VoiceLanguage = 'uz' | 'ru' | 'en';
type VoiceGender = 'female' | 'male';

export default function SynchronizedTranscript({
  result,
  onSeek,
}: SynchronizedTranscriptProps) {
  // Parsing lines from result
  const lines: TranscriptLine[] = useMemo(() => {
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

    if (result.timestamps && result.timestamps.length > 0) {
      return result.timestamps.map((t, idx) => ({
        id: idx,
        time: t.time,
        speaker: 'Spiker',
        originalText: t.text,
        translatedText: t.text,
      }));
    }

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

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>('uz');
  const [gender, setGender] = useState<VoiceGender>('female');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // UI state
  const [displayMode, setDisplayMode] = useState<TranscriptDisplayMode>('uzbek');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const activeLineIdxRef = useRef<number | null>(null);
  const preloadedAudiosRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  isPlayingRef.current = isPlaying;
  activeLineIdxRef.current = activeLineIdx;

  // Build text to read for a given line based on selected voiceLang
  const getTextForLine = (line: TranscriptLine, lang: VoiceLanguage): string => {
    if (lang === 'uz') {
      return line.translatedText || line.originalText;
    }
    return line.originalText || line.translatedText;
  };

  // Build API TTS URL
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

  // Stop playback cleanly
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  // Clean cleanup on unmount
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

  // Play a specific line
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
        // Move to next line
        playLine(idx + 1);
      }
    };

    audio.onerror = (e) => {
      console.warn(`[TTS Player] Audio playback error on line ${idx}:`, e);
      setIsLoadingAudio(false);
      // Fallback: move to next line after brief delay
      if (isPlayingRef.current && idx + 1 < lines.length) {
        setTimeout(() => playLine(idx + 1), 600);
      } else {
        stopAudio();
      }
    };

    try {
      await audio.play();
      setIsLoadingAudio(false);
      // Preload next line
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

  // Change language: stop current audio and change voice
  const handleLanguageChange = (newLang: VoiceLanguage) => {
    setVoiceLang(newLang);
    preloadedAudiosRef.current.clear();
    if (isPlaying && activeLineIdx !== null) {
      // Re-trigger with new language
      setTimeout(() => playLine(activeLineIdx), 50);
    }
  };

  // Change gender: Madina vs Sardor
  const handleGenderChange = (newGender: VoiceGender) => {
    setGender(newGender);
    preloadedAudiosRef.current.clear();
    if (isPlaying && activeLineIdx !== null) {
      setTimeout(() => playLine(activeLineIdx), 50);
    }
  };

  // Speed change
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Copy quote
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

  const handleCopyAll = () => {
    const fullText = lines
      .map((l) => `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}${l.translatedText}`)
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    const fullText = lines
      .map((l) => `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}${l.translatedText}`)
      .join('\n\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transkript_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  // Filter lines by search query
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

  return (
    <div className="space-y-4">
      {/* ================= 1. YAGONA VA QULAY AI OVOZLI PLEER (UNIFIED NEURAL PLAYER) ================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#0c1329] via-[#090f20] to-[#060b18] border border-blue-500/30 shadow-2xl space-y-4">
        {/* Top bar: Header & Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white tracking-tight">
                  Jonli Ovozli Tinglash & Dublyaj
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  AI Ravon Ovoz (100% Tabiiy)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Matnni o&apos;qishga vaqtingiz bo&apos;lmasa, videodagi barcha gaplarni ravon tilda eshiting
              </p>
            </div>
          </div>

          {/* Language Selector (Uzbek, Russian, English) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#040814] rounded-2xl border border-slate-800 shrink-0 self-end sm:self-auto">
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

        {/* Master Player Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Main Controls: Play, Stop, Prev, Next */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevLine}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Oldingi gap"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
              }`}
            >
              {isLoadingAudio ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>Yuklanmoqda...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>To&apos;xtatish</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ovozda Tinglash</span>
                </>
              )}
            </button>

            {isPlaying && (
              <button
                type="button"
                onClick={stopAudio}
                className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                title="Butunlay to'xtatish"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNextLine}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Keyingi gap"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Voice Gender Toggle (Madina vs Sardor) */}
            <div className="flex items-center gap-1 p-1 bg-[#040814] rounded-2xl border border-slate-800 ml-2">
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  gender === 'female'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Madina (Ayol ovozi)"
              >
                <span>👩 Madina</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  gender === 'male'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sardor (Erkak ovozi)"
              >
                <span>👨 Sardor</span>
              </button>
            </div>

            {/* Speed Options */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-[#040814] rounded-2xl border border-slate-800 ml-1">
              {[1.0, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
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

          {/* Currently Spoken Preview + Progress */}
          <div className="flex-1 min-w-0 bg-[#050914] rounded-2xl p-3 border border-slate-800/90 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs mb-1.5">
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
                {activeLineIdx !== null ? `${activeLineIdx + 1} / ${lines.length} gap (${progressPercent}%)` : `${lines.length} ta gap`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {activeLine && (
              <p className="text-xs text-slate-200 mt-2 truncate font-medium">
                &ldquo;{getTextForLine(activeLine, voiceLang)}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= 2. CONTROLS: DISPLAY MODES & EXPORT ================= */}
      <div className="p-3 sm:p-4 bg-[#070b16] rounded-3xl border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Display Mode: Uzbek / Original / Parallel */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setDisplayMode('uzbek')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'uzbek'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇺🇿 O&apos;zbekcha Tarjima</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('original')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'original'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>🌐 Asl Tilidagi Matn</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode('parallel')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                displayMode === 'parallel'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔄 Ikkala Til (Parallel)</span>
            </button>
          </div>

          {/* Export and Download Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="To'liq transkriptni nusxalash"
            >
              {copiedAll ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nusxalash</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title=".TXT formatda saqlash"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>.TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSrt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors cursor-pointer"
              title="Subtitr (.SRT) formatida yuklab olish"
            >
              <Subtitles className="w-3.5 h-3.5 text-cyan-400" />
              <span>.SRT Subtitr</span>
            </button>
          </div>
        </div>

        {/* Search Input & Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nutq matni, so'zlar yoki vaqt bo'yicha qidirish..."
              className="w-full bg-[#040711] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 px-1 shrink-0">
            <span className="font-medium text-cyan-400">
              {filteredLines.length} ta gap / segment
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:text-blue-300 text-[11px] underline cursor-pointer"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. SCROLLABLE TRANSCRIPT LIST ================= */}
      <div className="rounded-3xl border border-slate-800 bg-[#070b16] divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto shadow-2xl p-2 sm:p-3 space-y-1">
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
                    ? 'bg-blue-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'hover:bg-slate-900/60 border-transparent hover:border-slate-800/80'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Clickable Timestamp Chip */}
                  <button
                    type="button"
                    onClick={() => onSeek && onSeek(line.time)}
                    className="timestamp-chip shrink-0 font-mono text-[11px] font-bold bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 cursor-pointer"
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

                    {/* Render based on displayMode */}
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

                {/* Right Actions: Play this line & Copy Quote */}
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 px-2 gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Vaqt tugmasini bosib videodagi joyiga o&apos;ting yoki 🔊 tugmasini bosib ovozda tinglang</span>
        </span>
        <span className="text-cyan-400 font-semibold">
          1-2 Soatlik To&apos;liq Nutq & Avtomatik Ovozli Dublyaj
        </span>
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
