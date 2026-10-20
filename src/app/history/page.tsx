'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Download,
  Trash2,
  Calendar,
  Zap,
  ArrowRight,
  Filter,
  BarChart3,
  ExternalLink,
  Briefcase,
  Newspaper,
  GraduationCap,
  Smile,
  Users,
  Mic,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { HistoryItem, AnalysisMode } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const MODE_ICONS: Record<string, any> = {
  meeting: Briefcase,
  news: Newspaper,
  education: GraduationCap,
  child: Smile,
  interview: Users,
  pitch: Mic,
  chat: MessageSquare,
};

export default function HistoryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [tokenFilter, setTokenFilter] = useState<'any' | '<10k' | '10-50k' | '>50k'>('any');

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem('quanta_analysis_history') ||
        localStorage.getItem('tahlilchi_analysis_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error('History load error:', err);
      setHistory([]);
    }
  }, []);

  const totalTokens = history.reduce((sum, item) => sum + (item.tokens || 0), 0);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.result?.summary?.toLowerCase().includes(search.toLowerCase());
    const matchesMode = selectedMode === 'all' || item.mode === selectedMode;

    let matchesToken = true;
    const tokens = item.tokens || 0;
    if (tokenFilter === '<10k') matchesToken = tokens < 10000;
    else if (tokenFilter === '10-50k') matchesToken = tokens >= 10000 && tokens <= 50000;
    else if (tokenFilter === '>50k') matchesToken = tokens > 50000;

    return matchesSearch && matchesMode && matchesToken;
  });

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('quanta_analysis_history', JSON.stringify(updated));
    localStorage.setItem('tahlilchi_analysis_history', JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all analysis history?')) {
      setHistory([]);
      localStorage.removeItem('quanta_analysis_history');
      localStorage.removeItem('tahlilchi_analysis_history');
    }
  };

  const handleDownloadAllJson = () => {
    if (history.length === 0) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tahlilchi_history_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenItem = (item: HistoryItem) => {
    // Store active item for analyzer
    localStorage.setItem('quanta_active_analysis', JSON.stringify(item.result));
    if (item.videoUrl) {
      localStorage.setItem('quanta_active_video_url', item.videoUrl);
    }
    router.push('/analyzer');
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-6xl mx-auto w-full">
      {/* Header (Screenshot 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t.history.title}</h1>
          <p className="text-sm text-slate-400 mt-1">{t.history.subtitle}</p>
        </div>
      </div>

      {/* Filter and Action Bar with Gradient Backdrop */}
      <div className="bg-gradient-to-b from-[#0e172a]/95 to-[#090f1e]/95 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.history.searchPlaceholder}
              className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Mode Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="bg-[#0a0f1d] border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t.history.allModes}</option>
              <option value="meeting">{t.analyzer.modes.meeting.name}</option>
              <option value="news">{t.analyzer.modes.news.name}</option>
              <option value="education">{t.analyzer.modes.education.name}</option>
              <option value="child">{t.analyzer.modes.child.name}</option>
              <option value="interview">{t.analyzer.modes.interview.name}</option>
              <option value="pitch">{t.analyzer.modes.pitch.name}</option>
              <option value="chat">{t.analyzer.modes.chat.name}</option>
              <option value="document">{t.analyzer.modes.document.name}</option>
            </select>

            {/* Download JSON Button */}
            <button
              onClick={handleDownloadAllJson}
              disabled={history.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-[#0a0f1d] border border-slate-700/80 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Download JSON</span>
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClearAll}
              disabled={history.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-[#0a0f1d] border border-slate-700/80 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 hover:text-red-400 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.history.clear}</span>
            </button>
          </div>
        </div>

        {/* Secondary Row: Token Filter (Screenshot 5) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              {t.history.tokenFilter}
            </span>
            <div className="flex items-center gap-1">
              {(['any', '<10k', '10-50k', '>50k'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTokenFilter(opt)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    tokenFilter === opt
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#0a0f1d] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {opt === 'any' ? 'Any' : opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Tokens:</span>
            <span className="font-bold text-white font-mono">{totalTokens.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredHistory.length === 0 ? (
        /* Empty State Illustration with Atmospheric Backdrop */
        <div className="bg-gradient-to-b from-[#0e172a]/95 to-[#080d1a]/95 border border-slate-800/80 rounded-3xl p-12 sm:p-16 text-center shadow-xl backdrop-blur-xl flex flex-col items-center justify-center">
          {/* SVG Bar Chart Graphic */}
          <div className="w-36 h-28 mb-6 relative flex items-end justify-center gap-3">
            <div className="w-5 h-16 rounded-t-lg bg-gradient-to-t from-blue-600/30 to-blue-500/80 border-t border-blue-400 shadow-sm" />
            <div className="w-5 h-24 rounded-t-lg bg-gradient-to-t from-cyan-600/40 to-cyan-400 border-t border-cyan-300 shadow-lg shadow-cyan-500/25" />
            <div className="w-5 h-10 rounded-t-lg bg-gradient-to-t from-indigo-700/30 to-indigo-600/60 border-t border-indigo-500 shadow-sm" />
            <div className="w-5 h-20 rounded-t-lg bg-gradient-to-t from-emerald-600/30 to-emerald-400/80 border-t border-emerald-300 shadow-sm" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{t.history.emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
            {t.history.emptySub}
          </p>

          <Link
            href="/analyzer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-600/25 hover:shadow-cyan-500/30 transition-all"
          >
            <span>Go to Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        /* History Grid Cards with Unique Card Gradients */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item) => {
            const Icon = MODE_ICONS[item.mode] || Briefcase;
            return (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="bg-gradient-to-b from-[#0f172a] to-[#090e1c] border border-slate-800/80 hover:border-blue-500/50 rounded-3xl p-5 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        {item.mode}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors mb-2 line-clamp-2">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {item.result?.summary || 'No summary available.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{item.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 font-semibold">
                      {(item.tokens || 0).toLocaleString()} tokens
                    </span>
                    <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
