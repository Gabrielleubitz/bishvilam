"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="p-6">
        <h1 className="text-2xl">שגיאה כללית</h1>
        <p className="opacity-80">העמוד נטען מחדש כעת.</p>
        <button className="btn" onClick={() => reset()}>רענון</button>
      </body>
    </html>
  );
}