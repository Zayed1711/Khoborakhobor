"use client";

import { useEffect, useState } from "react";
import ProAuthGateModal, { type ProGateFeature } from "@/components/ProAuthGateModal";

/**
 * Opens the "log in to continue" prompt anywhere on the site. Features that need an
 * account send: window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature } })).
 */
export default function AuthGateHost() {
  const [feature, setFeature] = useState<ProGateFeature | null>(null);
  useEffect(() => {
    const open = (e: Event) => setFeature(((e as CustomEvent).detail?.feature as ProGateFeature) || "notebook");
    window.addEventListener("khobor_open_auth_gate", open);
    return () => window.removeEventListener("khobor_open_auth_gate", open);
  }, []);
  return <ProAuthGateModal isOpen={feature !== null} onClose={() => setFeature(null)} feature={feature ?? "notebook"} />;
}
