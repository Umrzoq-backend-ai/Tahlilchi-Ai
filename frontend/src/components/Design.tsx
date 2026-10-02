import type { ReactNode } from "react";
import { translate, type Language } from "@/lib/i18n";

export type IconName = "home" | "file" | "spark" | "chart" | "user" | "upload" | "check" | "menu" | "arrow" | "clock" | "shield" | "close" | "eye" | "logout" | "sun" | "moon";
const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
  file: <><path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 12h8M8 16h8"/></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/></>,
  chart: <><path d="M4 3v17h17M8 15v-4M13 15V7M18 15V4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></>,
  upload: <><path d="M7 17H5a4 4 0 0 1-.5-8A7.5 7.5 0 0 1 19 8a4.5 4.5 0 0 1 0 9h-2M12 21V10m-4 4 4-4 4 4"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  logout: <><path d="M10 3H4v18h6M9 12h12m-5-5 5 5-5 5"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
  moon: <path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 9 9 0 1 0 20.5 14.2Z"/>,
};
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M11 29V20M20 29V13M29 29V7" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/><circle cx="29" cy="7" r="3" fill="#5eead4"/></svg></span>;
}
export type View = "home" | "data" | "ai" | "results" | "account";
export const navigation: { id: View; label: string; short: string; icon: IconName }[] = [
  { id: "home", label: "Ish maydoni", short: "Asosiy", icon: "home" },
  { id: "data", label: "Fayllar tahlili", short: "Fayllar", icon: "file" },
  { id: "ai", label: "AI Tahlilchi", short: "AI savol", icon: "spark" },
  { id: "results", label: "Tarix va hisobotlar", short: "Natijalar", icon: "chart" },
  { id: "account", label: "Hisob sozlamalari", short: "Hisob", icon: "user" },
];
export function Navigation({ view, navigate, hasDataset, language, mobile = false }: { view: View; navigate: (view: View) => void; hasDataset: boolean; language: Language; mobile?: boolean }) {
  return <nav className={mobile ? "mobile-nav" : "primary-nav"} aria-label={mobile ? "Mobile navigation" : "Main navigation"}>{navigation.map(item => <button key={item.id} type="button" data-view-link={item.id} aria-current={view === item.id ? "page" : undefined} disabled={!hasDataset && ["data", "ai", "results"].includes(item.id)} onClick={() => navigate(item.id)}><Icon name={item.icon}/><span>{translate(language, mobile ? item.short : item.label)}</span></button>)}</nav>;
}
