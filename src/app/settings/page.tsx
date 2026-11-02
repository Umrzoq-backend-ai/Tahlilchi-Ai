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
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { testGeminiApiKey } from '@/lib/gemini-client';

const MODEL_OPTIONS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'O\'ta tezkor, multimodal sun\'iy intellekt va 1M tokenlik kontekst oynasi. Umumiy video, audio va PDF tahlili uchun eng yaxshi tavsiya.',
    badge: 'Tavsiya etiladi',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    desc: 'Yengil, yuqori tezlikdagi va tejamkor model. Qisqa vaqtda konspekt va tezkor xulosa olish uchun qulay.',
    badge: 'Tezkor',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    desc: 'Chuqur mantiqiy fikrlash, murakkab 3V tahlili va 2M ulkan tokenli kontekst. Ilmiy va texnik materiallar uchun.',
    badge: 'Pro',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    desc: 'Klassik va barqaror multimodal model. Ko\'p sinovdan o\'tgan mustahkam xizmat.',
    badge: 'Stabil',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    desc: 'Barcha standart Google AI Studio kalitlari bilan 100% mos keluvchi universal model.',
    badge: 'Universal',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    desc: 'Yangi avlod tezkor sinov modeli. Eng so\'nggi Google arxitekturasi.',
    badge: 'Preview',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    desc: 'Google kompaniyasining eng kuchli flagman sinov modeli (ruxsati bor hisoblar uchun).',
    badge: 'Preview',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
];

export default function SettingsPage() {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Testing API key state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
    if (confirm('Gemini API kalitini brauzer xotirasidan o\'chirmoqchimisiz?')) {
      localStorage.removeItem('quanta_api_key');
      localStorage.removeItem('tahlilchi_api_key');
      setApiKey('');
      setTestResult(null);
    }
  };

  const handleTestKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Iltimos, avval API kalitni kiriting.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testGeminiApiKey(trimmed, selectedModel);
      setTestResult(res);
      if (res.success) {
        // Auto-save on successful test
        localStorage.setItem('quanta_api_key', trimmed);
        localStorage.setItem('tahlilchi_api_key', trimmed);
        localStorage.setItem('quanta_model', selectedModel);
        localStorage.setItem('tahlilchi_model', selectedModel);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Tarmoq ulanishida kutilmagan xatolik yuz berdi.',
      });
    } finally {
      setIsTesting(false);
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
        {/* 1. API KEY SECTION */}
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
                    Kiritilgan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Kalit kiritilmagan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Video, audio va PDF hujjatlarni to'liq tahlil qilish uchun Google AI Studio bepul kaliti talab qilinadi.
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

          <div className="relative mb-3">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="AIzaSy..."
              className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-2xl px-4 py-3.5 pr-20 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title={showKey ? 'Kalitni berkitish' : 'Kalitni ko\'rsatish'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Kalitni tozalash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isTesting || !apiKey.trim()}
              onClick={handleTestKey}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isTesting || !apiKey.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isTesting ? 'Google Gemini tekshirilmoqda...' : '🔑 Kalitni Sinash (Test Connection)'}</span>
            </button>

            <span className="text-[11px] text-slate-500">
              100% bepul Google AI Studio kalitlari to'liq quvvatda ishlaydi.
            </span>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.success && (
                  <p className="text-[11px] text-emerald-400/80">
                    Kalit avtomatik saqlandi. Endi xaritada yoki Studiyada istalgan videoni tahlil qilishingiz mumkin!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. AI MODEL SELECTION */}
        <div className="bg-gradient-to-b from-[#0e172a]/95 to-[#090e1c]/95 border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {t.settings.modelLabel}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Zap className="w-3 h-3" />
                  Avtomatik Zaxira Himoyasi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Barcha Gemini modellari avtomatik zaxira tizimi bilan ta'minlangan. Agar tanlangan model vaqtincha band bo'lsa, tizim uzilishsiz boshqa model orqali tahlilni davom ettiradi.
              </p>
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

        {/* 3. SECURITY & PRIVACY NOTE */}
        <div className="p-5 rounded-3xl bg-[#0a0f1d]/60 border border-slate-800 flex items-start gap-3.5">
          <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-1">
            <h4 className="font-bold text-slate-200">Xavfsiz va Shaxsiy Ma'lumotlar</h4>
            <p className="leading-relaxed">
              Sizning API kalitingiz faqat o'z brauzeringiz xotirasida (localStorage) saqlanadi va serverda yozib qolinmaydi.
              So'rovlar to'g'ridan-to'g'ri Google Gemini xavfsiz kanallari orqali amalga oshiriladi.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition-all cursor-pointer"
          >
            {t.settings.save}
          </button>
        </div>
      </div>
    </div>
  );
}
