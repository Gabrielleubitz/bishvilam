"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl">אירעה שגיאה</h1>
      <p className="opacity-80">נא לרענן או לנסות שוב.</p>
      <button className="btn" onClick={() => reset()}>נסה שוב</button>
    </div>
  );
}