"use client";
import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase.client";

export function useEnsureProfile() {
  const once = useRef(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || once.current) return;
      once.current = true;
      try {
        const token = await user.getIdToken();
        await fetch("/api/auth/ensure-profile", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // no-op
      }
    });
    return () => unsub();
  }, []);
}