'use client';

import React, { useState, useEffect } from 'react';
import { Key, HelpCircle, Eye, EyeOff, Trash2, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'tahlilchi_api_key';
const MODEL_KEY = 'tahlilchi_model';

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Tezkor va Tavsiya etilgan)', badge: 'Tavsiya' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Yangi avlod tezkor)', badge: 'Yangi' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Chuqur tahlil & 3V)', badge: 'Pro' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Eksperimental)', badge: 'Preview' },
];

export default function SettingsModal() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey) setApiKey(storedKey);

    const storedModel = localStorage.getItem(MODEL_KEY);
    if (storedModel) setModel(storedModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, apiKey.trim());
    localStorage.setItem(MODEL_KEY, model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    if (confirm("Haqiqatan ham saqlangan API kalitni o'chirmoqchimisiz?")) {
      localStorage.removeItem(STORAGE_KEY);
      setApiKey('');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">Sozlamalar & API Kalit</h3>
            <p className="text-[10px] text-slate-400">Google Gemini API (BYOK)</p>
          </div>
        </div>

        {apiKey ? (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ulangan
          </span>
        ) : (
          <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            Kalit kiritilmagan
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Gemini API Kaliti <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Qanday olinadi?</span>
            </button>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-dark-bg border border-slate-700/80 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showGuide && (
          <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-xl text-[11px] text-slate-300 space-y-1.5">
            <span className="font-bold text-blue-300 block">Bepul API Kalit Olish Tartibi:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline font-semibold"
                >
                  aistudio.google.com
                </a>
                {' '}saytiga o'ting.
              </li>
              <li>Google hisobingiz bilan tizimga kiring.</li>
              <li>"Get API Key" tugmasini bosing va yangi kalit yarating.</li>
              <li>Kalitni nusxalab bu yerga joylashtiring.</li>
            </ol>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sun'iy Intellekt Modeli</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-dark-bg border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            {saved ? '✅ Saqlandi!' : 'Kalitni Saqlash'}
          </button>

          {apiKey && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 rounded-xl transition-colors"
              title="Kalitni o'chirish"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            <strong>100% Xavfsiz:</strong> Sizning API kalitingiz faqat brauzeringiz xotirasida saqlanadi. U tashqi
            serverlarga yuborilmaydi va saqlanmaydi.
          </span>
        </div>
      </div>
    </div>
  );
}
