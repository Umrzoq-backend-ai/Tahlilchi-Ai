'use client';

import React from 'react';
import { Info, X, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-slate-800 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Loyiha Haqida</h3>
              <p className="text-[11px] text-slate-400">Tahlilchi AI • Multimodal Video Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[70vh]">
          <div>
            <h4 className="font-bold text-sm text-slate-100 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Missiya</span>
            </h4>
            <p className="text-slate-400">
              Biz video va audio kontentga to'la davrda yashamoqdamiz. Tahlilchi AI axborotni uzoq kutish vaqtini yo'qotish
              uchun yaratilgan. Ilg'or multimodal sun'iy intellekt orqali har qanday uzun videoni bir necha soniyada
              inson uchun tushunarli, tizimli va interaktiv bilimga aylantiramiz.
            </p>
          </div>

          <div className="p-4 bg-dark-bg/60 border border-slate-800 rounded-2xl space-y-2">
            <h5 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Texnologik Arxitektura</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong>AI Modeli:</strong> Google Gemini 2.0 Flash / 2.5 Flash / 3 Pro (1-2M token kontekst).
              </li>
              <li>
                <strong>Frontend:</strong> Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons.
              </li>
              <li>
                <strong>Xavfsizlik:</strong> 100% Stateless va BYOK (Bring Your Own Key).
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100 block mb-0.5">Xavfsizlik & Maxfiylik</span>
              <p className="text-[11px] text-slate-400">
                Sizning API kalitingiz va tahlil tarixingiz faqat shaxsiy brauzeringizda saqlanadi. Hech qanday tashqi
                serverda video fayllar yoki parollar saqlanmaydi.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-dark-bg/40 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tahlilchi AI v2.0 Master</span>
          <span>Google Gemini Multimodal Platform</span>
        </div>
      </div>
    </div>
  );
}
