"use client";
import { FEATURES } from "@/lib/features";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import KhoborLogo from "@/components/KhoborLogo";
import FacebookButton from "@/components/FacebookButton";
import { VerifyEmailPanel, ForgotPasswordPanel } from "@/components/auth/EmailCodePanel";
import { 
  studentLoginAction, 
  studentSignupAction, 
  googleInstantLoginAction,
  requestMagicLinkAction,
  verifyMagicLinkAction,
  requestPhoneOtpAction,
  verifyPhoneOtpAction
} from "@/actions/auth";
import { 
  Lock, Mail, User, Eye, EyeOff, 
  ArrowRight, ShieldCheck, GraduationCap, Phone, Sparkles, CheckCircle2, AlertTriangle, KeyRound, Smartphone
} from "lucide-react";

function AuthForm() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const rawRedirect = searchParams.get("redirect") || "/";
  // SQA Security Fix (CWE-601): Prevent Open Redirect vulnerability
  const redirectUrl =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes(":")
      ? rawRedirect
      : "/";

  const [authCategory, setAuthCategory] = useState<"quick" | "password">("password");
  const [quickMethod, setQuickMethod] = useState<"phone" | "magic">("phone");
  const [mode, setMode] = useState<"login" | "signup">(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isInApp, setIsInApp] = useState(false);

  // Phone OTP state
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState("");

  // Magic Link state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicUrl, setMagicUrl] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  // Email code steps: the address waiting for its sign-up code, and "forgot password"
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [targetTrack, setTargetTrack] = useState("BCS_GOVT");
  const [institution, setInstitution] = useState("");

  // Detect In-App browser (Meta / FB / IG / Messenger) & auto-verify magicToken
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/FBAN|FBAV|Instagram|Line|Messenger/i.test(ua)) {
        setIsInApp(true);
        setAuthCategory("quick");
      }
    }

    const token = searchParams.get("magicToken");
    if (token) {
      setLoading(true);
      setError("");
      verifyMagicLinkAction(token).then((res) => {
        if (res.success) {
          window.location.assign(redirectUrl);
        } else {
          setError(res.error || "ম্যাজিক লিংকের মেয়াদ শেষ বা ভুল।");
          setLoading(false);
        }
      });
    }
  }, [searchParams, redirectUrl]);

  const handleGoogleSignIn = () => {
    setError("গুগল সরাসরি ওয়ান-ক্লিক সাইন-ইন সেবা দ্রুত সংহত হচ্ছে। অনুগ্রহ করে নিচের ফর্মে আপনার জিমেইল ও পাসওয়ার্ড দিয়ে সরাসরি লগইন বা নিবন্ধন করুন।");
    setAuthCategory("password");
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setError("অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর লিখুন।");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await requestPhoneOtpAction(phoneInput);
      if (res.success) {
        setOtpSent(true);
        setSuccessMsg("আপনার মোবাইলে ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে।");
      } else {
        setError(res.error || "ওটিপি পাঠাতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("অনুগ্রহ করে ওটিপি কোড লিখুন।");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await verifyPhoneOtpAction(phoneInput, otpCode);
      if (res.success) {
        window.location.assign(redirectUrl);
      } else {
        setError(res.error || "ওটিপি যাচাই ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) {
      setError("অনুগ্রহ করে আপনার ইমেইল লিখুন।");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await requestMagicLinkAction(magicEmail);
      if (res.success) {
        setMagicSent(true);
        setSuccessMsg("আপনার ইমেইলে ১-ক্লিক ম্যাজিক লিংক তৈরি হয়েছে।");
        if (res.magicUrl) setMagicUrl(res.magicUrl);
      } else {
        setError(res.error || "ম্যাজিক লিংক তৈরি করতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।");
    } finally {
      setLoading(false);
    }
  };

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
      if ("needsVerification" in res && res.needsVerification) {
        setVerifyEmail(res.email);
        if (res.error) setError(res.error);
      } else if (res.success) {
        window.location.assign(redirectUrl);
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

      if ("needsVerification" in res && res.needsVerification) {
        setVerifyEmail(res.email);
        if (res.error) setError(res.error);
      } else if (res.success) {
        window.location.assign(redirectUrl);
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
        <div className="flex justify-center mb-4">
          <KhoborLogo variant="horizontal" size="md" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1c1d21]">
          অ্যাকাউন্টে প্রবেশ করুন
        </h1>
        <p className="mt-1 text-xs text-[#646c7a]">
          ব্যক্তিগত স্টাডি নোটবুক, বিশ্লেষণ ও সক্রিয় প্রস্তুতি
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[#ded8cb] rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
        {FEATURES.trialPromo && (<>
{/* Founding Pro Trial Header Banner */}
        <div className="bg-[#fcfaf6] border border-[#ebd8b0] rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                ফাউন্ডিং প্রো ট্রায়াল (Founding Pro)
              </span>
            </div>
            <p className="text-xs text-[#656d7b] mt-0.5">
              অভিধান, কুইজ ও ক্লাউড নোটবুক ২ ডিসেম্বর পর্যন্ত ১০০% ফ্রি
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md text-xs font-bold text-[#842323] bg-[#fbf5f5] border border-[#eddada] shrink-0">
            FREE TRIAL
          </span>
        </div>
        </>)}

        {FEATURES.passwordlessLogin && (<>
{/* Meta / In-App Browser Warning Alert */}
        {isInApp && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ইন-অ্যাপ ব্রাউজার শনাক্ত হয়েছে:</span>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                Facebook বা Instagram ব্রাউজারে Google লগইন নিরাপত্তা ত্রুটি দেখাতে পারে। সরাসরি নিচের <strong>মোবাইল ওটিপি</strong> বা <strong>ম্যাজিক লিংক</strong> ব্যবহার করে পাসওয়ার্ড ছাড়া প্রবেশ করুন।
              </p>
            </div>
          </div>
        )}
        </>)}

        {FEATURES.googleSignIn && (<>
{/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white hover:bg-[#faf7f2] border border-[#d9d2c5] text-[#1c1d21] text-xs font-bold rounded-xl transition shadow-2xs flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google সাইন ইন (শীঘ্রই আসছে)</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-[#ece6d8] w-full"></div>
          <span className="bg-white px-3 text-xs text-[#8e95a2] uppercase tracking-wider font-semibold absolute">
            অথবা বিকল্প পদ্ধতিতে
          </span>
        </div>
        </>)}

        {FEATURES.passwordlessLogin && (<>
{/* Main Category Switcher: Quick (OTP/Magic) vs Traditional (Password) */}
        <div className="flex rounded-xl bg-[#f5f1e8] p-1 border border-[#e8e2d4]">
          <button
            type="button"
            onClick={() => { setAuthCategory("quick"); setError(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              authCategory === "quick"
                ? "bg-white text-[#17191d] shadow-2xs"
                : "text-[#656d7b] hover:text-[#17191d]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#842323]" />
            <span>মোবাইল ওটিপি / ম্যাজিক লিংক</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthCategory("password"); setError(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              authCategory === "password"
                ? "bg-white text-[#17191d] shadow-2xs"
                : "text-[#656d7b] hover:text-[#17191d]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#842323]" />
            <span>ইমেইল ও পাসওয়ার্ড</span>
          </button>
        </div>
        </>)}

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION A: QUICK PASSWORDLESS (PHONE OTP / MAGIC LINK)     */}
        {/* ======================================================== */}
        {authCategory === "quick" && (
          <div className="space-y-4">
            {/* Quick Sub-toggle */}
            <div className="flex border-b border-[#ece7dc] pb-2 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setQuickMethod("phone"); setError(""); setSuccessMsg(""); }}
                className={`pb-1 transition border-b-2 flex items-center gap-1.5 ${
                  quickMethod === "phone"
                    ? "border-[#842323] text-[#842323] font-bold"
                    : "border-transparent text-[#656d7b] hover:text-[#1c1d21]"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>মোবাইল নম্বর (Phone OTP)</span>
              </button>
              <button
                type="button"
                onClick={() => { setQuickMethod("magic"); setError(""); setSuccessMsg(""); }}
                className={`pb-1 transition border-b-2 flex items-center gap-1.5 ${
                  quickMethod === "magic"
                    ? "border-[#842323] text-[#842323] font-bold"
                    : "border-transparent text-[#656d7b] hover:text-[#1c1d21]"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>ইমেইল ম্যাজিক লিংক (Magic Link)</span>
              </button>
            </div>

            {/* A.1 Phone OTP Flow */}
            {quickMethod === "phone" && (
              <div className="space-y-3.5">
                {!otpSent ? (
                  <form onSubmit={handleRequestOtp} className="space-y-3.5">
                    <div>
                      <label htmlFor="phoneNum" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#842323]" />
                        <span>আপনার মোবাইল নম্বর (১১ ডিজিট)</span>
                      </label>
                      <input
                        id="phoneNum"
                        type="tel"
                        autoFocus
                        placeholder="যেমন: 01700000000"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21] font-mono tracking-wider"
                        required
                      />
                      <p className="text-xs text-[#717887] mt-1">
                        ইন-অ্যাপ ব্রাউজারে পাসওয়ার্ড ছাড়া সরাসরি এক ক্লিকে ওটিপি দিয়ে প্রবেশ করুন।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{loading ? "ওটিপি তৈরি হচ্ছে..." : "ওটিপি কোড পাঠান"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="otpValue" className="block text-xs font-semibold text-[#343a46] flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>৬ সংখ্যার ওটিপি কোড লিখুন</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-xs text-[#842323] hover:underline"
                        >
                          নম্বর পরিবর্তন
                        </button>
                      </div>
                      <input
                        id="otpValue"
                        type="text"
                        autoFocus
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-center text-base tracking-[0.3em] font-mono font-bold py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
                        required
                      />
                      {simulatedOtpCode && (
                        <div className="mt-2 p-2 bg-[#f6f2e8] border border-[#e2dcd0] rounded-lg text-xs text-[#555d6b] flex items-center justify-between">
                          <span>ট্রায়াল ডেমো কোড: <strong className="text-[#842323] font-mono text-xs">{simulatedOtpCode}</strong></span>
                          <button
                            type="button"
                            onClick={() => setOtpCode(simulatedOtpCode)}
                            className="text-[#842323] font-bold underline text-xs"
                          >
                            অটো-ফিল করুন
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{loading ? "যাচাই করা হচ্ছে..." : "যাচাই করুন ও প্রবেশ করুন"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* A.2 Magic Link Flow */}
            {quickMethod === "magic" && (
              <div className="space-y-3.5">
                {!magicSent ? (
                  <form onSubmit={handleRequestMagicLink} className="space-y-3.5">
                    <div>
                      <label htmlFor="magicMail" className="block text-xs font-semibold text-[#343a46] mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#842323]" />
                        <span>আপনার ইমেইল ঠিকানা</span>
                      </label>
                      <input
                        id="magicMail"
                        type="email"
                        autoFocus
                        placeholder="yourname@gmail.com"
                        value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 bg-[#fcfbf9] border border-[#ded8cb] rounded-xl focus:outline-none focus:border-[#842323] text-[#1c1d21]"
                        required
                      />
                      <p className="text-xs text-[#717887] mt-1">
                        কোনো পাসওয়ার্ড মনে রাখার প্রয়োজন নেই। সরাসরি ১ ক্লিকে লগইন করার লিঙ্ক তৈরি হবে।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{loading ? "ম্যাজিক লিংক তৈরি হচ্ছে..." : "ম্যাজিক লিংক তৈরি করুন"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3 p-3.5 bg-[#fcfaf6] border border-[#ebd8b0] rounded-xl text-center">
                    <p className="text-xs text-[#1c1d21] font-semibold">
                      আপনার তাৎক্ষণিক ১-ক্লিক ম্যাজিক লিংক প্রস্তুত!
                    </p>
                    <Link
                      href={magicUrl || "#"}
                      className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center justify-center gap-2"
                    >
                      <span>১-ক্লিকে সরাসরি অ্যাকাউন্টে প্রবেশ করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION B: TRADITIONAL EMAIL & PASSWORD                   */}
        {/* ======================================================== */}
        {/* Email code: verify a new account, or reset a forgotten password */}
        {authCategory === "password" && verifyEmail && (
          <VerifyEmailPanel
            email={verifyEmail}
            onDone={() => {
              window.location.assign(redirectUrl);
            }}
            onBack={() => setVerifyEmail(null)}
          />
        )}
        {authCategory === "password" && !verifyEmail && forgotOpen && (
          <ForgotPasswordPanel
            initialEmail={loginEmail}
            onDone={() => {
              window.location.assign(redirectUrl);
            }}
            onBack={() => setForgotOpen(false)}
          />
        )}

        {authCategory === "password" && !verifyEmail && !forgotOpen && (
          <div className="space-y-4">
            {/* Sub-toggle: Login vs Signup */}
            <div className="flex rounded-xl bg-[#f5f1e8] p-1 border border-[#e8e2d4]">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === "signup"
                    ? "bg-white text-[#17191d] shadow-2xs"
                    : "text-[#656d7b] hover:text-[#17191d]"
                }`}
              >
                নিবন্ধন (সাইন আপ)
              </button>
            </div>

            {/* B.1 Password Login Form */}
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
                      aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setForgotOpen(true);
                      }}
                      className="text-xs text-[#842323] font-semibold hover:underline"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>{loading ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* B.2 Password Signup Form */}
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
                    <span className="text-xs text-[#842323] font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>{loading ? "নিবন্ধন সম্পন্ন হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Help: our Facebook page */}
        <div className="pt-4 border-t border-[#ece7dc] text-center space-y-2">
          <p className="text-xs text-[#717887]">লগইন বা নিবন্ধনে সমস্যা? আমাদের ফেসবুক পেজে জানান।</p>
          <FacebookButton label="আমাদের ফেসবুক পেজ" className="w-full" />
        </div>

        {/* Bottom Gateway Nav */}
        <div className="pt-4 border-t border-[#ece7dc] flex items-center justify-center text-xs text-[#717887]">
          <Link href="/" className="hover:text-[#842323] transition flex items-center gap-1 font-medium">
            <span>← প্রচ্ছদে ফিরুন</span>
          </Link>
        </div>
      </div>

      {/* Meta-Standard Privacy & Copyright Seal */}
      <div className="mt-6 text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#717887]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2e744a]" />
          <span>ব্যবহারকারী গোপনীয়তা ও ডেটা সুরক্ষা নীতিমালা অনুযায়ী পরিচালিত</span>
        </div>
        <p className="text-xs text-[#8e95a2]">
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
