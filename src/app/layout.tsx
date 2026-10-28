import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://tahilchi-ai.uz'),
  title: 'Tahlilchi AI — Video, Ovoz va PDF Tahlili | Ro‘yxatdan o‘tishsiz',
  description:
    'Soatlab videolarni ko‘rish shart emas! Istalgan YouTube video, audio yozuv yoki PDF hujjatdan bir zumda eng muhim xulosalar, daqiqama-daqiqa vaqt belgilari (timestamps) va to‘liq o‘zbekcha transkriptni oling. Akkaunt talab qilinmaydi.',
  keywords: [
    'Tahlilchi AI',
    'Video Tahlil',
    'YouTube Tahlili',
    'Audio Transkript',
    'Ovozni matnga aylantirish',
    'PDF Tahlili',
    'Gemini AI Uzbekistan',
    'Suniy intellekt',
    'Video konspekt',
  ],
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Tahlilchi AI — Video, Ovoz va PDF Tahlili (Ro‘yxatdan o‘tishsiz)',
    description:
      'YouTube video, audio va PDF hujjatlardan 1 soniyada xulosa va to‘liq transkript oling. Akkaunt ochish shart emas.',
    siteName: 'Tahlilchi AI',
    type: 'website',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'Tahlilchi AI Logo' }],
  },
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
