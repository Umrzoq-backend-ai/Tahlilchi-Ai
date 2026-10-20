'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Key,
  Shield,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Cpu,
  Sparkles,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const MODEL_OPTIONS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Balanced speed, multimodal intelligence, and 1M context window. Best for general video analysis.',
    badge: 'Recommended',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    desc: 'Lightweight, ultra-fast, and cost-efficient for rapid summarization and high throughput.',
    badge: 'Fast',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    desc: 'Deep reasoning, complex 3V pitch breakdown, and massive 2M token context window.',
    badge: 'Pro',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    desc: 'Next-generation preview model engineered for low latency multimodal processing.',
    badge: 'Preview',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    desc: "Google's flagship multimodal model with maximum analytical capability and reasoning.",
    badge: 'Preview',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
];

export default function SettingsPage() {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key =
      localStorage.getItem('quanta_api_key') ||
      localStorage.getItem('tahlilchi_api_key') ||
      '';
    setApiKey(key);

    const model =
      localStorage.getItem('quanta_model') ||
      localStorage.getItem('tahlilchi_model') ||
      'gemini-2.5-flash';
    setSelectedModel(model);
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    localStorage.setItem('quanta_api_key', trimmed);
    localStorage.setItem('tahlilchi_api_key', trimmed);

    localStorage.setItem('quanta_model', selectedModel);
    localStorage.setItem('tahlilchi_model', selectedModel);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    if (confirm('Clear stored Gemini API key from browser?')) {
      localStorage.removeItem('quanta_api_key');
      localStorage.removeItem('tahlilchi_api_key');
      setApiKey('');
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 max-w-4xl mx-auto w-full">
      {/* Top back link */}
      <div className="mb-6">
        <Link
          href="/analyzer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.settings.back}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">{t.settings.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{t.settings.subtitle}</p>
      </div>

      {/* Saved Toast */}
      {saved && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.settings.saved}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. API KEY SECTION (Screenshot 7 & 8) */}
        <div className="bg-gradient-to-b from-[#0e172a]/95 to-[#090e1c]/95 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {t.settings.apiKeyLabel}
                </span>
                {apiKey ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Key required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Required for multimodal video, audio, and visual reasoning.
              </p>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>{t.settings.getKey}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-2xl px-4 py-3.5 pr-20 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Clear key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. AI MODEL SELECTION (Screenshot 8) */}
        <div className="bg-gradient-to-b from-[#0e172a]/95 to-[#090e1c]/95 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                {t.settings.modelLabel}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">{t.settings.modelNote}</p>
            </div>
            <a
              href="https://ai.google.dev/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>{t.settings.viewPricing}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            {MODEL_OPTIONS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/80 shadow-lg shadow-blue-500/10'
                      : 'bg-[#0a0f1d] border-slate-800/80 hover:border-slate-700 hover:bg-[#0c1428]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-4 h-4 rounded-full mt-1 border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{m.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeColor}`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. FREE TIER & STORAGE INFO (Replaced confusing amber billing with emerald access box) */}
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200/90 flex items-start gap-3.5 shadow-lg shadow-emerald-950/20">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                {t.settings.billingTitle}
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">{t.settings.billingDesc}</p>
          </div>
        </div>

        {/* 4. ACTIONS & REAL-TIME SAVE FEEDBACK */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-h-[24px]">
            {saved && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ {t.settings.saved}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {saved && (
              <Link
                href="/analyzer"
                className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg animate-fadeIn"
              >
                <span>{t.nav.analyzer}</span>
                <span>&rarr;</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleSave}
              className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40 scale-[1.02]'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-600/30 hover:shadow-cyan-500/40'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${saved ? 'text-white animate-bounce' : 'text-blue-200'}`} />
              <span>{saved ? t.settings.saved : t.settings.save}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
