// hooks/useRole.ts
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase.client";

export function useRole() {
  const [role, setRole] = useState<"admin"|"instructor"|"parent"|"student"|null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setRole(null); setUid(null); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        setRole((snap.data()?.role as any) ?? null);
      } catch {
        setRole(null);
      }
    });
    return () => unsub();
  }, []);

  return { role, uid };
}