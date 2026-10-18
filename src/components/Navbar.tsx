'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Globe, ChevronDown, Menu, X, Sparkles } from 'lucide-react';
import { useLanguage, Language } from '@/context/LanguageContext';

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

  // Close mobile menu on route change
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
    <header className="sticky top-0 z-50 bg-[#090e1a]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with Glowing Spinner */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#090e1a] rounded-full flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin-slow" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            Quanta
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-4 sm:gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors relative py-1 ${
                    isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Icon with Connection Status Dot */}
          <Link
            href="/settings"
            title={t.nav.settings}
            className={`relative p-2 rounded-xl transition-all ${
              pathname === '/settings'
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[#090e1a] ${
                hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={hasApiKey ? 'Gemini API Connected' : 'API Key Required'}
            />
          </Link>

          {/* Language Selector Pill */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111827] border border-slate-700/80 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase">{language}</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-500 transition-transform ${
                  langOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#131c31] border border-slate-800 rounded-2xl shadow-2xl py-1.5 overflow-hidden z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setLangOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    language === 'en'
                      ? 'text-blue-400 font-bold bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('uz');
                    setLangOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    language === 'uz'
                      ? 'text-blue-400 font-bold bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>O'zbekcha</span>
                  {language === 'uz' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('ru');
                    setLangOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    language === 'ru'
                      ? 'text-blue-400 font-bold bg-blue-500/10'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Русский</span>
                  {language === 'ru' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0c1222] px-6 py-4 space-y-3 animate-fadeIn">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-blue-400 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className="block py-2 text-sm font-semibold text-slate-300 hover:text-white border-t border-slate-800/80 pt-3"
          >
            {t.nav.settings}
          </Link>
        </div>
      )}
    </header>
  );
}
