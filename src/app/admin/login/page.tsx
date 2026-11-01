"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLoginAction } from "@/actions/auth";
import { Shield, Lock, ArrowRight, AlertTriangle, KeyRound, Terminal } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await adminLoginAction(passcode.trim());
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(res.error || "ভুল পাসকোড! সঠিক অ্যাডমিন কোড দিন।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f141c] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight">
          খবরাখবর অ্যাডমিন কনসোল
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          সম্পাদকীয় ও সিস্টেম প্রশাসনের জন্য সুরক্ষিত গেটওয়ে
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#16202e] border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>মাস্টার অ্যাডমিন পাসকোড</span>
              </label>
              <input
                id="passcode"
                type="password"
                autoFocus
                placeholder="সিক্রেট পাসকোড লিখুন..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full text-xs px-4 py-3 bg-[#0d141e] border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 text-white placeholder-slate-500 font-mono tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "যাচাই করা হচ্ছে..." : "কনসোলে প্রবেশ করুন"}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <Link href="/" className="hover:text-amber-400 transition">
              &larr; প্রচ্ছদে ফিরুন
            </Link>
            <Link href="/login" className="hover:text-amber-400 transition">
              শিক্ষার্থী লগইন &rarr;
            </Link>
          </div>
        </div>

        {/* Security Signature Stamp (Hidden in code data attribute) */}
        <div 
          data-security-id="SECURE_CRYPTOGRAPHIC_HASH_ENFORCED"
          className="mt-8 text-center text-[10px] text-slate-500"
        >
          <p>&copy; ২০২৬ খবরাখবর এডিটরিয়াল অটোমেশন প্ল্যাটফর্ম</p>
        </div>
      </div>
    </div>
  );
}

