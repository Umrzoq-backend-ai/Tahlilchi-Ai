'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-800/80 bg-[#070b14] py-10 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 text-sm">Quanta AI</span>
            <span>•</span>
            <span className="text-slate-400">Intelligence in Every Frame</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Powered by Google Gemini 2.5 & 3 Multimodal Architecture.
          </p>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <Link href="/" className="hover:text-slate-200 transition-colors">
            {t.nav.home}
          </Link>
          <Link href="/analyzer" className="hover:text-slate-200 transition-colors">
            {t.nav.analyzer}
          </Link>
          <Link href="/history" className="hover:text-slate-200 transition-colors">
            {t.nav.history}
          </Link>
          <Link href="/about" className="hover:text-slate-200 transition-colors">
            {t.nav.about}
          </Link>
          <Link href="/settings" className="hover:text-slate-200 transition-colors">
            {t.nav.settings}
          </Link>
        </div>
      </div>
    </footer>
  );
}
