'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Globe, ChevronDown, Menu, X, Sparkles, Activity } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/Logo';

export default function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = () => {
      const key =
        localStorage.getItem('quanta_api_key') ||
        localStorage.getItem('tahlilchi_api_key');
      setHasApiKey(!!key);
    };
    checkKey();
    window.addEventListener('storage', checkKey);
    return () => window.removeEventListener('storage', checkKey);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/analyzer', label: t.nav.analyzer },
    { href: '/history', label: t.nav.history },
    { href: '/about', label: t.nav.about },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070b16]/85 backdrop-blur-xl border-b border-slate-800/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 py-3 flex items-center justify-between relative">
        {/* 1. Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Logo size={32} />

          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              Tahlilchi
            </span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-500/30 tracking-wide">
              AI
            </span>
          </div>
        </Link>

        {/* 2. CENTER: Strictly Centered Floating Pill Navigation (User Requirement) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-700/60 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.5)] rounded-full p-1.5 flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 3. Right: Settings Gear, Language Selector, and Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Settings Icon with Connection Dot */}
          <Link
            href="/settings"
            title={t.nav.settings}
            className={`relative p-2.5 rounded-xl border transition-all ${
              pathname === '/settings'
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-sm shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-[#0e1628]/80 hover:bg-[#131d33] border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-[#070b16] ${
                hasApiKey ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'
              }`}
              title={hasApiKey ? 'Gemini API Ulangan' : 'API Kalit kiritilmagan'}
            />
          </Link>

          {/* Language Selector Pill */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e1628]/80 hover:bg-[#131d33] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase text-[11px] font-bold">{language}</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
                  langOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl py-1.5 overflow-hidden z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setLangOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    language === 'en'
                      ? 'text-cyan-400 font-bold bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('uz');
                    setLangOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    language === 'uz'
                      ? 'text-cyan-400 font-bold bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>O'zbekcha</span>
                  {language === 'uz' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('ru');
                    setLangOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    language === 'ru'
                      ? 'text-cyan-400 font-bold bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Русский</span>
                  {language === 'ru' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#090e1c] px-6 py-4 space-y-2 animate-fadeIn shadow-2xl">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 border-t border-slate-800/80 pt-3 mt-2"
          >
            {t.nav.settings}
          </Link>
        </div>
      )}
    </header>
  );
}
