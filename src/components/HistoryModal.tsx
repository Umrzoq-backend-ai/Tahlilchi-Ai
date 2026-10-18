'use client';

import React, { useState, useEffect } from 'react';
import { History, X, Search, Trash2, Download, Calendar, ChevronRight } from 'lucide-react';
import { HistoryItem, AnalysisResponse } from '@/types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}

const HISTORY_KEY = 'tahlilchi_analysis_history';

export const saveToHistory = (result: AnalysisResponse, videoUrl?: string) => {
  try {
    const existing = localStorage.getItem(HISTORY_KEY);
    let history: HistoryItem[] = existing ? JSON.parse(existing) : [];

    const newItem: HistoryItem = {
      id: String(Date.now()),
      title: result.metadata?.title || result.headline || `${result.mode?.toUpperCase()} tahlili`,
      mode: result.mode || 'meeting',
      createdAt: new Date().toLocaleString(),
      tokens: result.tokens?.total_tokens || 0,
      result,
      videoUrl: videoUrl || undefined,
    };

    history = [newItem, ...history.filter((h) => h.id !== newItem.id)].slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Tarixga saqlashda xato:', err);
  }
};

export default function HistoryModal({ isOpen, onClose, onSelect }: HistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (e) {
        setHistory([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesMode = selectedMode === 'all' || item.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (confirm("Butun tahlillar tarixini o'chirishni xohlaysizmi?")) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tahlilchi_tarix_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Tahlillar Tarixi</h3>
              <p className="text-[11px] text-slate-400">Brauzeringizda saqlangan avvalgi tahlillar</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportJson}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                  title="JSON Eksport"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearAll}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-colors"
                  title="Tarixni tozalash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800/80 bg-dark-bg/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sarlavha bo'yicha qidirish..."
              className="w-full bg-dark-card border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="bg-dark-card border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Barcha rejimlar</option>
            <option value="meeting">Uchrashuv</option>
            <option value="education">Ta'lim</option>
            <option value="interview">Intervyu</option>
            <option value="child">Bolalar</option>
            <option value="pitch">Notiqlik (3V)</option>
            <option value="news">Yangiliklar</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Tahlillar tarixi bo'sh</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="p-3.5 bg-dark-bg/60 hover:bg-dark-card border border-slate-800 hover:border-blue-500/50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.mode}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.createdAt}
                    </span>
                    {item.tokens ? (
                      <span className="text-[10px] text-slate-500">{item.tokens.toLocaleString()} token</span>
                    ) : null}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
