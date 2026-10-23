'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number; // base height in px
  withGlow?: boolean;
}

export default function Logo({ className = '', size = 32, withGlow = true }: LogoProps) {
  const width = Math.round(size * 1.205);
  const height = size;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {withGlow && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/25 to-blue-600/25 blur-md rounded-full pointer-events-none -z-10 group-hover:blur-lg group-hover:from-cyan-400/40 group-hover:to-blue-500/40 transition-all duration-300"
        />
      )}
      <Image
        src="/logo.png"
        alt="Tahlilchi AI Logo"
        width={width}
        height={height}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="object-contain group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.45)] transition-all duration-300 select-none"
        priority
      />
    </div>
  );
}
