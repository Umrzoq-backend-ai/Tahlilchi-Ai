'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Custom Brand Icons
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.63 3.73-.53.36-1.02.54-1.45.53-.48-.01-1.4-.27-2.09-.49-.84-.27-1.51-.42-1.45-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.74-1.91 5.27-1.92.12 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.15-.04.25z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74V9.93H5.06v8.57h2.8z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

export default function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="relative border-t border-slate-800/80 bg-[#050813] pt-14 pb-10 mt-auto text-xs text-slate-400 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[140px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        {/* 3 Clean Columns: Exactly matching user reference design */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Column 1: Brand & Bio (5 cols) */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#050813] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-black text-white text-lg tracking-tight">
                Tahlilchi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {language === 'en'
                ? 'Intelligence in every frame. Tahlilchi AI transforms raw video, audio, and documents into structured, actionable insights.'
                : language === 'ru'
                ? 'Интеллект в каждом кадре. Tahlilchi AI превращает видео, аудио и документы в структурированные выводы.'
                : 'Har bir kadrdagi aql. Tahlilchi AI xom video, audio va hujjatlarni amaliy tushunchalarga aylantiradi.'}
            </p>
          </div>

          {/* Column 2: Platforma (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {language === 'en' ? 'Platform' : language === 'ru' ? 'Платформа' : 'Platforma'}
            </h4>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li>
                <Link href="/analyzer" className="hover:text-cyan-400 transition-colors">
                  {language === 'en' ? 'Open Studio' : language === 'ru' ? 'Открыть Студию' : 'Studiyani Ochish'}
                </Link>
              </li>
              <li>
                <Link href="/analyzer" className="hover:text-cyan-400 transition-colors">
                  {language === 'en' ? 'Features & Capabilities' : language === 'ru' ? 'Возможности' : 'Imkoniyatlar'}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors">
                  {language === 'en' ? 'About Project' : language === 'ru' ? 'О проекте' : 'Loyiha Haqida'}
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-cyan-400 transition-colors">
                  {language === 'en' ? 'Settings' : language === 'ru' ? 'Настройки' : 'Sozlamalar'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Bog'lanish (Social & Dev Profiles) (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {language === 'en' ? 'Connect' : language === 'ru' ? 'Связь' : "Bog'lanish"}
            </h4>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li>
                <a
                  href="https://t.me/zoltanma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-cyan-400 transition-colors group"
                >
                  <TelegramIcon className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Telegram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/umrzoqyulchiyevcode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-cyan-400 transition-colors group"
                >
                  <LinkedInIcon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/umrzoq_21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-cyan-400 transition-colors group"
                >
                  <InstagramIcon className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://umrzoq-yulchiyev.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-cyan-400 transition-colors group"
                >
                  <Globe className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Portfolio</span>
                </a>
              </li>
              <li>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-cyan-400 transition-colors group"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Google AI Studio</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar: Exact Copyright format matching user specification */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            <p className="font-semibold text-slate-300">
              © 2026 Tahlilchi AI. Umrzoq Yulchiyev tomonidan yaratilgan.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-200 transition-colors">
              {language === 'en' ? 'Privacy Policy' : language === 'ru' ? 'Политика конфиденциальности' : 'Maxfiylik Siyosati'}
            </Link>
            <Link href="/about" className="hover:text-slate-200 transition-colors">
              {language === 'en' ? 'Terms of Service' : language === 'ru' ? 'Условия использования' : 'Foydalanish Shartlari'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
