import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Quanta | Intelligence in Every Frame',
  description:
    'Transform raw video footage into clarity. From corporate meetings to educational content, Quanta extracts the signal from the noise instantly.',
  keywords: ['Quanta AI', 'Video Intelligence', 'Gemini 2.5', 'Gemini 3', 'Multimodal Video AI'],
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
