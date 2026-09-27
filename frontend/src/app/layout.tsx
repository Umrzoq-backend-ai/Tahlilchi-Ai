import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Analyst — Ma’lumotdan qarorgacha",
  description: "CSV va Excel fayllarini tekshiring, tahlil qiling va Gemini agentidan savol so‘rang.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz"><head><link rel="icon" href="data:," /></head><body>{children}</body></html>;
}
