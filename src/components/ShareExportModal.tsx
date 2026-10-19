'use client';

import React, { useState } from 'react';
import {
  Share2,
  Printer,
  Copy,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  QrCode,
  FileText,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';

interface ShareExportModalProps {
  result: AnalysisResponse;
  videoUrl?: string | null;
  onClose?: () => void;
}

export default function ShareExportModal({
  result,
  videoUrl,
  onClose,
}: ShareExportModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const title = result.metadata?.title || result.headline || result.document_title || 'Tahliliy Hisobot';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://tahlilchi.uz';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* 1. Shareable Link Box */}
      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" />
            Jamoa va Hamkasblar bilan Ulashish Havolasi
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Ommaviy Havola
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ushbu havola orqali har qanday odam tahlil natijalarini to'liq ko'ra oladi (hisob ochishi shart emas):
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-[#070b16] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-lg shadow-blue-600/20"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Nusxalandi!' : 'Nusxa Olish'}</span>
          </button>
        </div>
      </div>

      {/* 2. Professional Printable Report Card (A4 Executive PDF ready) */}
      <div className="p-5 bg-gradient-to-b from-[#090e1a] to-[#070b16] rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-400" />
              Rasmiy A4 Chop Etish va PDF Hisobot (Executive Dossier)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Rahbariyat, yig'ilishlar va investorlar stoliga qo'yish uchun rasmiy formatda chop eting
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Chop etish / PDF saqlash</span>
          </button>
        </div>

        {/* Printable Preview Mockup */}
        <div className="p-4 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 text-left space-y-3 font-sans">
          <div className="flex items-start justify-between border-b pb-2">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-blue-600">
                TAHLILCHI AI • MULTIMODAL INTELLIGENCE REPORT
              </span>
              <h5 className="text-sm font-black text-slate-900 mt-0.5 leading-snug">
                {title}
              </h5>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                <span>Manba: {result.metadata?.author || 'Media'}</span>
                <span>•</span>
                <span>Sana: {new Date().toLocaleDateString('uz-UZ')}</span>
                <span>•</span>
                <span>Rejim: {result.mode?.toUpperCase()}</span>
              </div>
            </div>
            <div className="w-12 h-12 border border-slate-300 rounded flex items-center justify-center text-slate-400 text-[9px] text-center font-mono shrink-0">
              [QR KOD]
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <strong className="text-[11px] uppercase tracking-wider text-slate-700 block">
              1. Asosiy Xulosa (Executive Brief)
            </strong>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {result.summary.slice(0, 280)}...
            </p>
          </div>

          {result.key_facts && result.key_facts.length > 0 && (
            <div className="space-y-1 text-xs pt-1 border-t">
              <strong className="text-[11px] uppercase tracking-wider text-slate-700 block">
                2. Tasdiqlangan Faktlar
              </strong>
              <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
                {result.key_facts.slice(0, 3).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t">
            <span>Rasmiy hisobot avtomatik shakllantirildi</span>
            <span className="font-mono">Tahlilchi AI 2.0 • Maxfiylik va Sifat Kafolati</span>
          </div>
        </div>
      </div>
    </div>
  );
}
