import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tahlilchi AI | Intelligence in Every Frame',
  description:
    "Video va audio kontentni multimodal sun'iy intellekt (Gemini 2.5/3) orqali kadrma-kadr va chuqur tahlil qilish platformasi.",
  keywords: ['AI video tahlil', 'multimodal AI', 'Google Gemini', 'Tahlilchi AI', 'meeting minutes', 'quiz generator'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="dark">
      <body className="antialiased min-h-screen bg-dark-bg text-slate-100 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
