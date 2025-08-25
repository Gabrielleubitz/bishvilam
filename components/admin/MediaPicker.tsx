// components/admin/MediaPicker.tsx
"use client";
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase.client";
import { useRole } from "@/hooks/useRole";

export default function MediaPicker() {
  const { role, uid } = useRole();
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setBusy(true);
    try {
      const timestamp = Date.now();
      const base = role === "admin"
        ? `uploads/${timestamp}-${file.name}`
        : `user-uploads/${uid}/${timestamp}-${file.name}`;

      const storage = getStorage();
      const fileRef = ref(storage, base);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "media"), {
        ownerUid: uid,
        type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file",
        title: file.name,
        storagePath: base,
        srcUrl: url,
        tags: [],
        createdAt: serverTimestamp(),
        visible: role === "admin" // admins can choose to show immediately
      });
      alert("הקובץ הועלה בהצלחה");
    } catch (err) {
      console.error(err);
      alert("שגיאת הרשאות או העלאה");
    } finally {
      setBusy(false);
      e.currentTarget.value = ""; // reset input
    }
  }

  return (
    <div className="card space-y-3">
      <div className="text-sm opacity-80">
        {role === "admin"
          ? "מנהל: העלאה לתיקיית uploads (כתיבה מותרת)."
          : "משתמש: העלאה לתיקיית user-uploads (כתיבה מותרת לחשבון שלך בלבד)."}
      </div>
      <input type="file" onChange={onFile} disabled={busy} />
    </div>
  );
}