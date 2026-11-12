"use client";

import { useEffect, useState } from "react";
import { Loader2, MailCheck, KeyRound, ArrowLeft } from "lucide-react";
import { rememberPending } from "@/lib/pending-auth";
import { requestPasswordResetAction, resendVerificationCodeAction, resetPasswordAction, verifyEmailCodeAction } from "@/actions/auth";

const bn = (n: number) => n.toLocaleString("bn-BD");
const field = "w-full px-3.5 py-2.5 rounded-lg border border-[#ded8cb] bg-white text-sm outline-none focus:border-[#842323]";
const primary = "w-full py-2.5 rounded-lg bg-[#842323] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2";

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="••••••"
      aria-label="৬ সংখ্যার কোড"
      className={`${field} text-center text-2xl tracking-[0.5em] font-bold`}
    />
  );
}

/** "Send again" with a one-minute wait, matching the server's limit. */
function useCooldown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, restart: () => setLeft(seconds) };
}

/** After sign-up (or logging in to an unverified account): enter the code sent to the email. */
export function VerifyEmailPanel({ email, onDone, onBack }: { email: string; onDone: () => void; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const cooldown = useCooldown(60);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    const r = await verifyEmailCodeAction(email, code).catch(() => ({ success: false as const, error: "সার্ভারে সংযোগ করা যায়নি।" }));
    setBusy(false);
    if (r.success) onDone();
    else setError(r.error);
  };

  const resend = async () => {
    setNote("");
    setError("");
    const r = await resendVerificationCodeAction(email).catch(() => ({ success: false as const, error: "সার্ভারে সংযোগ করা যায়নি।" }));
    if (r.success) {
      setNote(r.message);
      cooldown.restart();
    } else setError(r.error);
  };

  return (
    <form onSubmit={verify} className="space-y-4" aria-label="ইমেইল যাচাই">
      <div className="text-center space-y-1.5">
        <MailCheck className="w-10 h-10 text-[#842323] mx-auto" />
        <h2 className="text-lg font-bold text-[#17191d]">ইমেইল যাচাই করুন</h2>
        <p className="text-sm text-[#525a68] leading-relaxed">
          <strong className="break-all">{email}</strong> ঠিকানায় একটি ৬ সংখ্যার কোড পাঠানো হয়েছে। কোডটি নিচে লিখুন (ইনবক্সে না পেলে স্প্যাম ফোল্ডার দেখুন)।
        </p>
      </div>
      <CodeInput value={code} onChange={setCode} />
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {note && <p className="text-sm text-emerald-700">{note}</p>}
      <button type="submit" disabled={code.length !== 6 || busy} className={primary}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} যাচাই করে প্রবেশ করুন
      </button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-[#68707f] hover:text-[#17191d] inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </button>
        <button type="button" onClick={resend} disabled={cooldown.left > 0} className="text-[#842323] font-semibold disabled:text-[#9aa1ad]">
          {cooldown.left > 0 ? `আবার কোড পাঠান (${bn(cooldown.left)})` : "আবার কোড পাঠান"}
        </button>
      </div>
    </form>
  );
}

/** "Forgot password": email → code → new password. */
export function ForgotPasswordPanel({
  initialEmail = "",
  initialStep = "email",
  onDone,
  onBack,
}: {
  initialEmail?: string;
  /** "code" when the page reloaded while the reader was fetching the code from their mail */
  initialStep?: "email" | "code";
  onDone: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<"email" | "code">(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const cooldown = useCooldown(0);

  const request = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const r = await requestPasswordResetAction(email).catch(() => ({ success: false as const, error: "সার্ভারে সংযোগ করা যায়নি।" }));
    setBusy(false);
    if (r.success) {
      setNote(r.message);
      setStep("code");
      rememberPending("reset", email.trim().toLowerCase());
      cooldown.restart();
    } else setError(r.error);
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || password.length < 6 || busy) return;
    setBusy(true);
    setError("");
    const r = await resetPasswordAction(email, code, password).catch(() => ({ success: false as const, error: "সার্ভারে সংযোগ করা যায়নি।" }));
    setBusy(false);
    if (r.success) onDone();
    else setError(r.error);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1.5">
        <KeyRound className="w-10 h-10 text-[#842323] mx-auto" />
        <h2 className="text-lg font-bold text-[#17191d]">পাসওয়ার্ড ভুলে গেছেন?</h2>
        <p className="text-sm text-[#525a68]">{step === "email" ? "আপনার অ্যাকাউন্টের ইমেইল লিখুন; আমরা একটি ৬ সংখ্যার কোড পাঠাব।" : note || "আপনার ইমেইলে পাঠানো ৬ সংখ্যার কোড ও নতুন পাসওয়ার্ড লিখুন।"}</p>
      </div>
      {step === "email" ? (
        <form onSubmit={request} className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="আপনার@gmail.com" aria-label="ইমেইল" required className={field} />
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={!email.trim() || busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} কোড পাঠান
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-3" aria-label="নতুন পাসওয়ার্ড">
          <CodeInput value={code} onChange={setCode} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="নতুন পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)"
            aria-label="নতুন পাসওয়ার্ড"
            autoComplete="new-password"
            className={field}
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button type="submit" disabled={code.length !== 6 || password.length < 6 || busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} পাসওয়ার্ড বদলে প্রবেশ করুন
          </button>
          <button type="button" onClick={() => request()} disabled={busy} className="w-full text-sm text-[#842323] font-semibold">
            আবার কোড পাঠান
          </button>
        </form>
      )}
      <button type="button" onClick={onBack} className="text-sm text-[#68707f] hover:text-[#17191d] inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> লগইনে ফিরে যান
      </button>
    </div>
  );
}
