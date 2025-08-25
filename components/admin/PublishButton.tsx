// components/admin/PublishButton.tsx
"use client";
import { useState } from "react";
import { getAuth } from "firebase/auth";

export default function PublishButton({ sourcePath, destPath }:{
  sourcePath: string; destPath: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onPublish() {
    setBusy(true);
    try {
      const user = getAuth().currentUser;
      const token = user ? await user.getIdToken() : null;
      const res = await fetch("/api/media/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sourcePath, destPath })
      });
      if (!res.ok) throw new Error(await res.text());
      alert("פורסם ל-public/");
    } catch (e) {
      console.error(e);
      alert("פרסום נכשל (הרשאות?)");
    } finally {
      setBusy(false);
    }
  }

  return <button className="btn" disabled={busy} onClick={onPublish}>פרסום ל־public</button>;
}