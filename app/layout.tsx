import './globals.css';
import { Suspense } from "react";
import AuthBootstrap from '@/components/AuthBootstrap';
import { Heebo } from 'next/font/google';

const heebo = Heebo({ 
  subsets: ['hebrew'], 
  variable: '--font-heebo' 
});

export const metadata = { 
  title: "כושר קרבי - הכנה לצה״ל בגוש עציון",
  description: "אימוני הכנה לצה״ל לתלמידי תיכון: כוח, סיבולת, ניווט, עבודת צוות ובטיחות"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head />
      <body className={`${heebo.variable} font-heebo bg-[#0B0B0B] text-white`}>
        <AuthBootstrap>
          <Suspense fallback={<div className="p-6 text-lg">טוען…</div>}>
            {children}
          </Suspense>
        </AuthBootstrap>
      </body>
    </html>
  );
}