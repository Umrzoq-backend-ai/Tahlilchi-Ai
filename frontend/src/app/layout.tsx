import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tahlilchi Studio — Ma’lumotdan qarorgacha",
  description: "CSV va Excel fayllarini tekshiring, tahlil qiling va Gemini agentidan savol so‘rang.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz"><head><link rel="stylesheet" href="/fonts/jakarta.css"/><link rel="stylesheet" href="/fonts/space.css"/><link rel="icon" href="/brand.svg" /></head><body>{children}</body></html>;
}
