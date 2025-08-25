"use client";
import { PropsWithChildren } from "react";
import { useEnsureProfile } from "@/hooks/useEnsureProfile";

// Hooks must run at the top level of a client component.
// This renders children immediately and runs the hook after mount.
export default function AuthBootstrap({ children }: PropsWithChildren) {
  useEnsureProfile();
  return <>{children}</>;
}