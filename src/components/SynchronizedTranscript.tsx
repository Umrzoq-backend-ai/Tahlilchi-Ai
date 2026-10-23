'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Copy,
  CheckCircle2,
  Play,
  Download,
  Languages,
  FileText,
  Subtitles,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { AnalysisResponse, AudioTimelineItem } from '@/types';
import VoiceReader, { VoiceReaderItem } from './VoiceReader';

interface SynchronizedTranscriptProps {
  result: AnalysisResponse;
  onSeek?: (timeStr: string) => void;
}

interface TranscriptLine {
  time: string;
  endTime?: string;
  speaker?: string;
  emotion?: string;
  originalText: string;
  translatedText: string;
}

type TranscriptDisplayMode = 'uzbek' | 'original' | 'parallel';

export default function SynchronizedTranscript({
  result,
  onSeek,
}: SynchronizedTranscriptProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [displayMode, setDisplayMode] = useState<TranscriptDisplayMode>('uzbek');
  const [activeSpokenId, setActiveSpokenId] = useState<number | null>(null);
  const [singleSpeakingIdx, setSingleSpeakingIdx] = useState<number | null>(null);

  // Parse lines from audio_timeline, raw transcript, or fallback
  const lines: TranscriptLine[] = useMemo(() => {
    // 1. Primary: Rich audio_timeline with original text and translation
    if (result.audio_timeline && result.audio_timeline.length > 0) {
      return result.audio_timeline.map((item) => ({
        time: item.start || '00:00',
        endTime: item.end,
        speaker: item.speaker || 'Spiker',
        emotion: item.emotion,
        originalText: item.text || item.translation || '',
        translatedText: item.translation || item.text || '',
      }));
    }

    // 2. Secondary: If raw transcript string has [MM:SS] lines
    if (result.transcript) {
      const parsed: TranscriptLine[] = [];
      const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?:([^:\n\r]+):\s*)?([^[\n\r]+)/g;
      let match;
      while ((match = regex.exec(result.transcript)) !== null) {
        const time = match[1];
        const speaker = match[2]?.trim() || undefined;
        const text = match[3]?.trim() || '';
        if (text) {
          parsed.push({
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
      return result.timestamps.map((t) => ({
        time: t.time,
        speaker: 'Spiker',
        originalText: t.text,
        translatedText: t.text,
      }));
    }

    // 4. Fallback default
    return [
      {
        time: '00:00',
        speaker: 'Spiker',
        originalText: result.summary || 'Video boshlanishi',
        translatedText: result.summary || 'Video boshlanishi',
      },
    ];
  }, [result]);

  // VoiceReader Items mapping
  const voiceReaderItems: VoiceReaderItem[] = useMemo(() => {
    return lines.map((l, idx) => ({
      id: idx,
      time: l.time,
      speaker: l.speaker,
      text: l.translatedText,
      originalText: l.originalText,
    }));
  }, [lines]);

  // Auto-scroll to active spoken line
  useEffect(() => {
    if (activeSpokenId !== null) {
      const el = document.getElementById(`transcript-line-${activeSpokenId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSpokenId]);

  // Single line speak
  const speakSingleLine = (text: string, idx: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (singleSpeakingIdx === idx) {
        setSingleSpeakingIdx(null);
        return;
      }
      setSingleSpeakingIdx(idx);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.onend = () => setSingleSpeakingIdx(null);
      u.onerror = () => setSingleSpeakingIdx(null);
      window.speechSynthesis.speak(u);
    }
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
      .map((l) => {
        if (displayMode === 'original') {
          return `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}${l.originalText}`;
        }
        if (displayMode === 'parallel') {
          return `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}\nAsl: ${l.originalText}\nTarjima: ${l.translatedText}\n`;
        }
        return `[${l.time}] ${l.speaker ? `${l.speaker}: ` : ''}${l.translatedText}`;
      })
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
      if (isEnd) totalSec += 4; // Default segment length if no end time

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

  return (
    <div className="space-y-4">
      {/* 1. EMBEDDED AI VOICE READER & DUBLYAJ PLAYER */}
      <VoiceReader
        items={voiceReaderItems}
        summaryText={result.summary}
        currentActiveId={activeSpokenId}
        onActiveItemChange={setActiveSpokenId}
      />

      {/* 2. Top Controls Bar */}
      <div className="p-4 bg-[#070b16] rounded-3xl border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Language Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setDisplayMode('uzbek')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === 'parallel'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔄 Ikkala Til (Parallel)</span>
            </button>
          </div>

          {/* Action Buttons: Copy All, Download TXT, Download SRT */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title=".TXT formatda saqlash"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>.TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSrt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors"
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
                className="text-blue-400 hover:text-blue-300 text-[11px] underline"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Transcript Scroll Container */}
      <div className="rounded-3xl border border-slate-800 bg-[#070b16] divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto shadow-2xl p-2 sm:p-3 space-y-1">
        {filteredLines.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            &ldquo;{searchQuery}&rdquo; bo&apos;yicha hech qanday gap topilmadi.
          </div>
        ) : (
          filteredLines.map((line, idx) => {
            const isLineActive = activeSpokenId === idx || singleSpeakingIdx === idx;
            return (
              <div
                key={idx}
                id={`transcript-line-${idx}`}
                className={`p-3 sm:p-4 rounded-2xl transition-all group flex items-start justify-between gap-3 border ${
                  isLineActive
                    ? 'bg-blue-950/40 border-cyan-400/80 shadow-lg shadow-cyan-500/10'
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
                        <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          O&apos;qilmoqda
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

                {/* Right Actions: Individual Speak Button & Copy Quote */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      speakSingleLine(
                        displayMode === 'original' ? line.originalText : line.translatedText,
                        idx
                      )
                    }
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      singleSpeakingIdx === idx
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-400'
                    }`}
                    title="Ushbu gapni ovozda tinglash"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${singleSpeakingIdx === idx ? 'animate-bounce' : ''}`} />
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
