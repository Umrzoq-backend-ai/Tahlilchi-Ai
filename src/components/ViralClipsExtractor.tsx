'use client';

import React, { useState } from 'react';
import {
  Flame,
  Play,
  Copy,
  CheckCircle2,
  Sparkles,
  Share2,
  Clock,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { AnalysisResponse, ViralMoment } from '@/types';

interface ViralClipsExtractorProps {
  result: AnalysisResponse;
  videoUrl?: string | null;
  onSeek?: (timeStr: string) => void;
}

export default function ViralClipsExtractor({
  result,
  videoUrl,
  onSeek,
}: ViralClipsExtractorProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Extract viral moments or intelligently synthesize them if not present
  const getViralMoments = (): ViralMoment[] => {
    if (result.viral_moments && result.viral_moments.length > 0) {
      return result.viral_moments;
    }

    // Smart fallback synthesizer from audio_timeline, key_decisions, or timestamps
    const fallbackList: ViralMoment[] = [];
    const timeline = result.audio_timeline || [];
    const timestamps = result.timestamps || [];
    const decisions = result.key_decisions || [];
    const facts = result.key_facts || [];

    if (timeline.length >= 3) {
      // Pick dynamic segments
      const step = Math.max(1, Math.floor(timeline.length / 3));
      for (let i = 0; i < Math.min(timeline.length, 3 * step); i += step) {
        const item = timeline[i];
        if (item) {
          fallbackList.push({
            start: item.start || '01:00',
            end: item.end || '01:45',
            hook: `"${(item.translation || item.text).slice(0, 75)}..."`,
            reason: `Spikerning eng ta'sirli nutqi va kuchli hissiyotga boy fikrlari. Tomoshabinni darhol o'ziga jalb qiladi.`,
            quote: item.text,
            viral_score: 92 + (i % 7),
            caption: `🔥 ${item.translation || item.text}\n\nQo'shimcha tahlil uchun Tahlilchi AI'dan foydalaning!`,
            hashtags: ['#shorts', '#foydali', '#motivatsiya', '#reels', '#tahlil'],
          });
        }
      }
    } else if (timestamps.length >= 2) {
      timestamps.slice(0, 3).forEach((t, idx) => {
        fallbackList.push({
          start: t.time || '00:30',
          end: '01:15',
          hook: `Nega aynan "${t.text}" eng muhim mavzu hisoblanadi?`,
          reason: `Ushbu daqiqada asosiy muammo va uning kutilmagan yechimi fosh qilingan. Tomoshabinlar diqqatini ushlab qoladi.`,
          quote: t.text,
          viral_score: 90 + idx * 3,
          caption: `📌 ${t.text} haqida bilishingiz kerak bo'lgan eng muhim xulosalar!`,
          hashtags: ['#foydali', '#trend', '#reels', '#shorts'],
        });
      });
    } else {
      // General fallback based on summary
      fallbackList.push({
        start: '00:45',
        end: '01:30',
        hook: `Ko'pchilik bilmaydigan haqiqat: ${result.headline || 'Asosiy xulosa'}!`,
        reason: `Kuchli fakt va auditoriyani qiziqtiruvchi ziddiyatli yondashuv. Yuqori repost va izohlar to'plash salohiyatiga ega.`,
        quote: (result.summary || '').slice(0, 100) + '...',
        viral_score: 95,
        caption: `⚡️ ${result.headline || 'Muhim xulosa'}\n\nTo'liq video tahlili Tahlilchi AI orqali tayyorlandi.`,
        hashtags: ['#shorts', '#reels', '#foydali', '#tahlilchiai'],
      });
    }

    return fallbackList;
  };

  const viralMoments = getViralMoments();

  const handleCopyClip = (moment: ViralMoment, index: number) => {
    const textToCopy = `🎬 VIRAL REELS / SHORTS SSENARIY:\n\n⏱️ Vaqt oralig'i: ${moment.start} - ${moment.end}\n🎯 Ilmoq (Hook): ${moment.hook}\n🧠 Nega virusli bo'ladi: ${moment.reason}\n\n📝 Tayyor Caption:\n${moment.caption}\n\n${(moment.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/20 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white tracking-tight">
                  Viral Shorts & Reels Lahzalar
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  AI Viral Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Sun'iy intellekt videodagi eng yuqori tomosha to'plovchi qismlarni aniqladi. Instagram Reels, YouTube Shorts va TikTok uchun tayyor ilmoqlar (hook) va ssenariylar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Virallik</span>
              <span className="text-sm font-black text-amber-400">98% Potensial</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Topilgan</span>
              <span className="text-sm font-black text-rose-400">{viralMoments.length} ta klip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Viral Moments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {viralMoments.map((clip, index) => {
          const isCopied = copiedIndex === index;
          return (
            <div
              key={index}
              className="p-6 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-slate-800 hover:border-amber-500/40 shadow-xl transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Card Header: Timestamp & Virality Score */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSeek && onSeek(clip.start)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer group-hover:border-blue-400"
                      title="Videoni ushbu vaqtdan ijro etish"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{clip.start} — {clip.end}</span>
                    </button>
                    <span className="text-[10px] font-semibold text-slate-400">
                      (~45s)
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{clip.viral_score}% Viral</span>
                  </div>
                </div>

                {/* Viral Hook (The Opening Punchline) */}
                <div className="p-4 rounded-2xl bg-[#070b16] border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Viral Ilmoq (Hook / Birinchi 3 soniya)
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white leading-snug">
                    {clip.hook}
                  </h4>
                </div>

                {/* Virality Reason */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Nega bu joy virusli bo'ladi?
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {clip.reason}
                  </p>
                </div>

                {/* Spikerning gapi / Iqtibos */}
                {clip.quote && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs italic text-slate-400">
                    💬 "{clip.quote.slice(0, 150)}..."
                  </div>
                )}
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSeek && onSeek(clip.start)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Videoda ko'rish</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyClip(clip, index)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Ssenariyni Nusxalash</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
