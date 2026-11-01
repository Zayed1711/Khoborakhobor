"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { studentLoginAction, studentSignupAction } from "@/actions/auth";
import { 
  Lock, Mail, User, Eye, EyeOff, 
  ArrowRight, ShieldCheck, GraduationCap, Phone
} from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const redirectUrl = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "signup">(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [targetTrack, setTargetTrack] = useState("BCS_GOVT");
  const [institution, setInstitution] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড পূরণ করুন।");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await studentLoginAction(loginEmail, loginPassword);
      if (res.success) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(res.error || "লগইন ব্যর্থ হয়েছে। তথ্য পুনরায় যাচাই করুন।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError("অনুগ্রহ করে নাম, ইমেইল এবং পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    // Standard credential validation: Must be @gmail.com
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(signupEmail.trim())) {
      setError("নিবন্ধন করার জন্য অবশ্যই একটি বৈধ @gmail.com ইমেইল ঠিকানা ব্যবহার করতে হবে।");
      return;
    }

    if (signupPassword.length < 6) {
      setError("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await studentSignupAction({
        name,
        email: signupEmail,
        password: signupPassword,
        phone: phone.trim() || undefined,
        targetTrack,
        institution,
      });

      if (res.success) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(res.error || "নিবন্ধন সম্পন্ন করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভারে সমস্যা দেখা দিয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block group mb-3">
          <span className="text-3xl sm:text-4xl font-black font-serif text-[#17191d] group-hover:text-[#842323] transition tracking-tight">
            খবরাখবর
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1c1d21]">
          {mode === "login" ? "অ্যাকাউন্টে প্রবেশ করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
        </h1>
        <p className="mt-1 text-xs text-[#646c7a]">
          ব্যক্তিগত স্টাডি নোটবুক, বিশ্লেষণ ও সক্রিয় প্রস্তুতি
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[#ded8cb] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Clean Segmented Tab Toggle */}
        <div className="flex rounded-xl bg-[#f5f1e8] p-1 border border-[#e8e2d4]">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === "login"
                ? "bg-white text-[#17191d] shadow-2xs"
                : "text-[#656d7b] hover:text-[#17191d]"
            }`}
          >
            লগইন
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === "signup"
                ? "bg-white text-[#17191d] shadow-2xs"
                : "text-[#656d7b] hover:text-[#17191d]"
            }`}
          >
            নিবন্ধন (সাইন আপ)
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* 1. Login Form */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="loginEmail" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#842323]" />
                <span>ইমেইল ঠিকানা</span>
              </label>
              <input
                id="loginEmail"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="your.email@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
                required
              />
            </div>

            <div>
              <label htmlFor="loginPass" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#842323]" />
                <span>পাসওয়ার্ড</span>
              </label>
              <div className="relative">
                <input
                  id="loginPass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="আপনার গোপন পাসওয়ার্ড"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87909f] hover:text-[#1c1d21] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#646c7a]">অ্যাকাউন্ট নেই? </span>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); }}
                className="text-xs font-bold text-[#842323] hover:underline"
              >
                নতুন অ্যাকাউন্ট তৈরি করুন
              </button>
            </div>
          </form>
        )}

        {/* 2. Signup Form */}
        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#842323]" />
                <span>আপনার পূর্ণ নাম</span>
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="যেমন: সাকিব আল হাসান"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
                required
              />
            </div>

            <div>
              <label htmlFor="signupEmail" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#842323]" />
                  <span>ইমেইল ঠিকানা (@gmail.com)</span>
                </span>
                <span className="text-[10px] text-[#842323] font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  @gmail.com আবশ্যক
                </span>
              </label>
              <input
                id="signupEmail"
                type="email"
                autoComplete="email"
                placeholder="yourname@gmail.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
                required
              />
              <p className="text-[11px] text-[#6b7280] mt-1">
                শিক্ষার্থী নিবন্ধনের স্ট্যান্ডার্ড অনুযায়ী অবশ্যই সক্রিয় <strong>@gmail.com</strong> ইমেইল দিন।
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#842323]" />
                <span>মোবাইল নম্বর (ঐচ্ছিক)</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="যেমন: 01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
              />
            </div>

            <div>
              <label htmlFor="signupPass" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#842323]" />
                <span>পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</span>
              </label>
              <div className="relative">
                <input
                  id="signupPass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="একটি শক্তিশালী পাসওয়ার্ড তৈরি করুন"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87909f] hover:text-[#1c1d21] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="targetTrack" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#842323]" />
                <span>পরীক্ষার প্রস্তুতি ট্র্যাক</span>
              </label>
              <select
                id="targetTrack"
                value={targetTrack}
                onChange={(e) => setTargetTrack(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
              >
                <option value="BCS_GOVT">বিসিএস ও সরকারি চাকরি প্রস্তুতি</option>
                <option value="ADMISSION">বিশ্ববিদ্যালয় ও বুয়েট/মেডিকেল ভর্তি</option>
                <option value="GENERAL_KNOWLEDGE">সাধারণ জ্ঞান ও সমসাময়িক বিষয়</option>
                <option value="RESEARCH">অর্থনীতি, আন্তর্জাতিক নীতি ও পলিসি গবেষণা</option>
              </select>
            </div>

            <div>
              <label htmlFor="institution" className="block text-xs font-semibold text-[#343a46] mb-1.5">
                শিক্ষা প্রতিষ্ঠান (ঐচ্ছিক)
              </label>
              <input
                id="institution"
                type="text"
                placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয় / নটর ডেম কলেজ"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "নিবন্ধন সম্পন্ন হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#646c7a]">ইতোমধ্যে অ্যাকাউন্ট আছে? </span>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="text-xs font-bold text-[#842323] hover:underline"
              >
                লগইন করুন
              </button>
            </div>
          </form>
        )}

        {/* Bottom Gateway Nav */}
        <div className="pt-4 border-t border-[#ece7dc] flex items-center justify-center text-xs text-[#717887]">
          <Link href="/" className="hover:text-[#842323] transition flex items-center gap-1 font-medium">
            <span>&larr; প্রচ্ছদে ফিরুন</span>
          </Link>
        </div>
      </div>

      {/* Meta-Standard Privacy & Copyright Seal */}
      <div className="mt-6 text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-[#717887]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2e744a]" />
          <span>ব্যবহারকারী গোপনীয়তা ও ডেটা সুরক্ষা নীতিমালা অনুযায়ী পরিচালিত</span>
        </div>
        <p className="text-[10px] text-[#8e95a2]">
          কপিরাইট &copy; ২০২৬ খবরাখবর ডিজিটাল &bull; সর্বস্বত্ব সংরক্ষিত
        </p>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={<div className="text-xs text-[#717887]">লোড হচ্ছে...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
