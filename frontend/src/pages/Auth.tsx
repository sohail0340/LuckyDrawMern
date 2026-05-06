import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/useAuth";

type Tab = "login" | "signup";
type SignupMethod = "email" | "phone";

function getRefFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || "";
}

function getTabFromUrl(): Tab {
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") === "signup" ? "signup" : "login";
}

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function isValidPhone(val: string) {
  return /^(\+?92|0)?[3][0-9]{9}$/.test(val.replace(/\s/g, ""));
}

export default function Auth() {
  const [, navigate] = useLocation();
  const { login, register, user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>(getTabFromUrl);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>("email");

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPass, setLoginShowPass] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginDone, setLoginDone] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupRef, setSignupRef] = useState(getRefFromUrl);
  const [signupShowPass, setSignupShowPass] = useState(false);
  const [signupShowConfirm, setSignupShowConfirm] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [apiError, setApiError] = useState("");

  // Redirect if already logged in — must be after all hooks
  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard");
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    );
  }

  function validateLogin() {
    const errs: Record<string, string> = {};
    const id = loginIdentifier.trim();
    if (!id) errs.identifier = "Please enter your email or phone number.";
    else if (!isValidEmail(id) && !isValidPhone(id))
      errs.identifier = "Enter a valid email address or phone number.";
    if (!loginPassword) errs.password = "Password is required.";
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validateLogin()) return;
    setApiError("");
    setLoginLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword);
      setLoginDone(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setApiError(err.message || "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  function validateSignup() {
    const errs: Record<string, string> = {};
    if (!signupName.trim()) errs.name = "Full name is required.";
    if (signupMethod === "email") {
      if (!signupEmail.trim()) errs.contact = "Email address is required.";
      else if (!isValidEmail(signupEmail)) errs.contact = "Enter a valid email address.";
    } else {
      if (!signupPhone.trim()) errs.contact = "Phone number is required.";
      else if (!isValidPhone(signupPhone)) errs.contact = "Enter a valid phone number (e.g. 03001234567).";
    }
    if (!signupPassword) errs.password = "Password is required.";
    else if (signupPassword.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!signupConfirm) errs.confirm = "Please confirm your password.";
    else if (signupConfirm !== signupPassword) errs.confirm = "Passwords do not match.";
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validateSignup()) return;
    setApiError("");
    setSignupLoading(true);
    try {
      const identifier = signupMethod === "email" ? signupEmail.trim() : signupPhone.trim();
      await register({
        identifier,
        name: signupName.trim(),
        password: signupPassword,
        referralCode: signupRef.trim() || undefined,
      });
      setSignupDone(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  }

  const inputClass =
    "bg-[#111118] border border-white/10 text-white placeholder:text-zinc-500 rounded-xl h-12 px-4 focus:border-[#FFD700]/50 focus:ring-0 focus:outline-none w-full text-sm";
  const errorClass = "text-red-400 text-xs mt-1";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-4 md:px-8">
        <Link href="/">
          <BrandLogo />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center pt-20 pb-10 px-4">
        <div className="w-full max-w-md">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FFD700]/5 blur-3xl pointer-events-none" />
          <div className="relative bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <div className="h-1 bg-linear-to-r from-[#FFE680] via-[#FFD700] to-[#B8860B]" />
            <div className="p-6 md:p-8">
              <div className="flex bg-[#0a0a0f] rounded-xl p-1 mb-7">
                {(["login", "signup"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setApiError(""); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                      tab === t
                        ? "bg-linear-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {t === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* API Error */}
              {apiError && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {apiError}
                </div>
              )}

              {/* LOGIN */}
              {tab === "login" && (
                loginDone ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-[#FFD700]" />
                    <p className="text-white font-semibold text-lg">Welcome back!</p>
                    <p className="text-zinc-400 text-sm">Taking you to your dashboard…</p>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} noValidate className="space-y-4">
                    <div>
                      <h2 className="text-white text-xl font-bold mb-0.5">Welcome back</h2>
                      <p className="text-zinc-400 text-sm mb-5">Login to your Kaptan Lucky Draw account</p>
                      <Input
                        type="text"
                        placeholder="Enter Email or Phone Number"
                        value={loginIdentifier}
                        onChange={(e) => { setLoginIdentifier(e.target.value); setLoginErrors((p) => ({ ...p, identifier: "" })); }}
                        className={inputClass}
                      />
                      {loginErrors.identifier && <p className={errorClass}>{loginErrors.identifier}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <Input
                          type={loginShowPass ? "text" : "password"}
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: "" })); }}
                          className={inputClass + " pr-11"}
                        />
                        <button type="button" onClick={() => setLoginShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white" tabIndex={-1}>
                          {loginShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {loginErrors.password && <p className={errorClass}>{loginErrors.password}</p>}
                      <div className="text-right mt-1.5">
                        <button type="button" className="text-[#FFD700] text-xs hover:underline">Forgot Password?</button>
                      </div>
                    </div>
                    <Button type="submit" disabled={loginLoading} className="w-full h-12 rounded-xl bg-linear-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black font-bold text-sm hover:opacity-90 border-none shadow-[0_0_15px_rgba(255,215,0,0.2)] mt-1">
                      {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
                    </Button>
                    <p className="text-center text-zinc-500 text-sm pt-1">
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setTab("signup")} className="text-[#FFD700] font-semibold hover:underline">Sign Up</button>
                    </p>
                  </form>
                )
              )}

              {/* SIGNUP */}
              {tab === "signup" && (
                signupDone ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-[#FFD700]" />
                    <p className="text-white font-semibold text-lg">Account created!</p>
                    <p className="text-zinc-400 text-sm">Taking you to your dashboard…</p>
                  </div>
                ) : (
                  <form onSubmit={handleSignup} noValidate className="space-y-4">
                    <div>
                      <h2 className="text-white text-xl font-bold mb-0.5">Create account</h2>
                      <p className="text-zinc-400 text-sm mb-5">Join thousands of winners on Kaptan Lucky Draw</p>
                    </div>
                    <div className="flex bg-[#0a0a0f] rounded-xl p-1">
                      {(["email", "phone"] as SignupMethod[]).map((m) => (
                        <button key={m} type="button" onClick={() => setSignupMethod(m)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${signupMethod === m ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30" : "text-zinc-500 hover:text-white"}`}>
                          Sign up with {m === "email" ? "Email" : "Phone Number"}
                        </button>
                      ))}
                    </div>
                    <div>
                      <Input type="text" placeholder="Full Name" value={signupName}
                        onChange={(e) => { setSignupName(e.target.value); setSignupErrors((p) => ({ ...p, name: "" })); }}
                        className={inputClass} />
                      {signupErrors.name && <p className={errorClass}>{signupErrors.name}</p>}
                    </div>
                    <div>
                      <Input
                        type={signupMethod === "email" ? "email" : "tel"}
                        placeholder={signupMethod === "email" ? "Email Address" : "Phone Number (e.g. 03001234567)"}
                        value={signupMethod === "email" ? signupEmail : signupPhone}
                        onChange={(e) => { if (signupMethod === "email") setSignupEmail(e.target.value); else setSignupPhone(e.target.value); setSignupErrors((p) => ({ ...p, contact: "" })); }}
                        className={inputClass} />
                      {signupErrors.contact && <p className={errorClass}>{signupErrors.contact}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <Input type={signupShowPass ? "text" : "password"} placeholder="Password (min. 8 characters)"
                          value={signupPassword}
                          onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors((p) => ({ ...p, password: "" })); }}
                          className={inputClass + " pr-11"} />
                        <button type="button" onClick={() => setSignupShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white" tabIndex={-1}>
                          {signupShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupErrors.password && <p className={errorClass}>{signupErrors.password}</p>}
                    </div>
                    <div>
                      <div className="relative">
                        <Input type={signupShowConfirm ? "text" : "password"} placeholder="Confirm Password"
                          value={signupConfirm}
                          onChange={(e) => { setSignupConfirm(e.target.value); setSignupErrors((p) => ({ ...p, confirm: "" })); }}
                          className={inputClass + " pr-11"} />
                        <button type="button" onClick={() => setSignupShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white" tabIndex={-1}>
                          {signupShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupErrors.confirm && <p className={errorClass}>{signupErrors.confirm}</p>}
                    </div>
                    <div>
                      <Input type="text" placeholder="Referral Code (optional)" value={signupRef}
                        onChange={(e) => setSignupRef(e.target.value)} className={inputClass} />
                      {signupRef.trim() && (
                        <p className="text-zinc-500 text-xs mt-1.5 flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFD700]/60" />
                          Referral bonus will be awarded to the referrer after successful signup
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={signupLoading} className="w-full h-12 rounded-xl bg-linear-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black font-bold text-sm hover:opacity-90 border-none shadow-[0_0_15px_rgba(255,215,0,0.2)] mt-1">
                      {signupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                    </Button>
                    <p className="text-center text-zinc-500 text-sm pt-1">
                      Already have an account?{" "}
                      <button type="button" onClick={() => setTab("login")} className="text-[#FFD700] font-semibold hover:underline">Login</button>
                    </p>
                  </form>
                )
              )}
            </div>
          </div>
          <p className="text-center text-zinc-600 text-xs mt-6">
            By continuing, you agree to our{" "}
            <span className="text-zinc-400 hover:text-white cursor-pointer">Terms of Service</span> &amp;{" "}
            <span className="text-zinc-400 hover:text-white cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
