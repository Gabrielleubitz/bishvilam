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
  description: "אימוני הכנה לצה״ל לתלמידי תיכון: כוח, סיבולת, ניווט, עבודת צוות ובטיחות",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "כושר קרבי"
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="כושר קרבי" />
        <meta name="theme-color" content="#10B981" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
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