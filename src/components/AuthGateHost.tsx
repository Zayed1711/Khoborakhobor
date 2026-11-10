"use client";

import { useEffect, useState } from "react";
import ProAuthGateModal, { type ProGateFeature } from "@/components/ProAuthGateModal";

/**
 * Opens the "log in to continue" prompt anywhere on the site. Features that need an
 * account send: window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature, redirect } })).
 * `redirect` (optional, a same-site path) is where the student lands after logging in.
 */
export default function AuthGateHost() {
  const [gate, setGate] = useState<{ feature: ProGateFeature; redirect?: string } | null>(null);
  useEffect(() => {
    const open = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      setGate({ feature: (d.feature as ProGateFeature) || "notebook", redirect: typeof d.redirect === "string" ? d.redirect : undefined });
    };
    window.addEventListener("khobor_open_auth_gate", open);
    return () => window.removeEventListener("khobor_open_auth_gate", open);
  }, []);
  return (
    <ProAuthGateModal
      isOpen={gate !== null}
      onClose={() => setGate(null)}
      feature={gate?.feature ?? "notebook"}
      redirectTo={gate?.redirect}
    />
  );
}
