import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Tahlilchi AI | Har bir kadrdagi aql va zakovat',
  description:
    'Video va audio materiallardan amaliy tushunchalar, qarorlar va testlar ajratib oluvchi multimodal sun’iy intellekt platformasi.',
  keywords: ['Tahlilchi AI', 'Video Intelligence', 'Gemini 2.5', 'Gemini 3', 'Multimodal Video AI', 'Uzbekistan AI'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#090e1a] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
        <LanguageProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
