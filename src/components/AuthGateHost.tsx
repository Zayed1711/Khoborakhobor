"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ProAuthGateModal, { type ProGateFeature } from "@/components/ProAuthGateModal";

/**
 * Opens the "log in to continue" prompt anywhere on the site. Features that need an
 * account send: window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature, redirect } })).
 * `redirect` (optional, a same-site path) is where the student lands after logging in.
 */
export default function AuthGateHost() {
  // The page the prompt was opened on. It is only shown while the reader is still there,
  // so it can never sit on top of the login page (or any other page) it sent them to.
  const [gate, setGate] = useState<{ feature: ProGateFeature; redirect?: string; path: string } | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    const open = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      setGate({ feature: (d.feature as ProGateFeature) || "notebook", redirect: typeof d.redirect === "string" ? d.redirect : undefined, path: window.location.pathname });
    };
    window.addEventListener("khobor_open_auth_gate", open);
    return () => window.removeEventListener("khobor_open_auth_gate", open);
  }, []);
  return (
    <ProAuthGateModal
      isOpen={gate !== null && gate.path === pathname}
      onClose={() => setGate(null)}
      feature={gate?.feature ?? "notebook"}
      redirectTo={gate?.redirect}
    />
  );
}
