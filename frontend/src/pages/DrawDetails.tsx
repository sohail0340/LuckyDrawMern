import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";
import { fixImageUrl } from "@/lib/imageUrl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Ticket,
  Eye,
  Car,
  Bike,
  Flame,
  Sparkles,
  ShieldCheck,
  Wallet,
  Smartphone,
  Landmark,
  Copy,
  Check,
  Upload,
  CheckCircle2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Hash,
  Calendar,
  Trophy,
  ChevronDown,
  Info,
  FileText,
  X,
  BadgeCheck,
  Hourglass,
  Image as ImageIcon,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";

import type { Draw, Category } from "@/data/draws";
import { publicApi, userApi, type ApiPublicDraw, type ApiPaymentAccounts } from "@/lib/api";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";

type JoinStep = "tokens" | "payment" | "proof" | "pending" | "success";
const STEP_ORDER: JoinStep[] = ["tokens", "payment", "proof", "pending", "success"];
const JOIN_STEPS: { id: JoinStep; label: string }[] = [
  { id: "tokens", label: "Tokens" },
  { id: "payment", label: "Payment" },
  { id: "proof", label: "Proof" },
  { id: "pending", label: "Review" },
  { id: "success", label: "Done" },
];

function apiToDraw(d: ApiPublicDraw): Draw {
  type CatMeta = { icon: LucideIcon; category: Category; type: string };
  const catMap: Record<string, CatMeta> = {
    cars: { icon: Car, category: "Cars" as Category, type: "Car Draw" },
    bikes: { icon: Bike, category: "Bikes" as Category, type: "Bike Draw" },
    cash: { icon: Wallet, category: "Cash" as Category, type: "Cash Draw" },
    electronics: { icon: Smartphone, category: "Electronics" as Category, type: "Electronics Draw" },
  };
  const meta = catMap[d.category.toLowerCase()] ?? { icon: Trophy, category: "Cash" as Category, type: d.category };
  const endsInMs = d.endsAt ? new Date(d.endsAt).getTime() - Date.now() : 0;
  return {
    id: String(d.id),
    drawId: `DRAW-${d.id}`,
    title: d.name,
    tagline: d.prize,
    type: meta.type,
    category: meta.category,
    icon: meta.icon,
    prizeValue: d.prizeValuePkr,
    tokenPrice: d.tokenPricePkr,
    totalTokens: d.tokenLimit,
    soldTokens: d.tokensSold,
    maxPerUser: d.tokenLimit,
    image: d.imageUrl ?? "",
    endsInDays: Math.max(0, Math.ceil(endsInMs / 86400000)),
    drawDate: d.endsAt
      ? new Date(d.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + " · PKT"
      : "TBD",
    hot: d.badges?.split(",").includes("hot") ?? false,
    isNew: d.badges?.split(",").includes("new") ?? false,
  };
}

import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";

export default function DrawDetails() {
  const params = useParams<{ id: string }>();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [apiDraw, setApiDraw] = useState<ApiPublicDraw | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<ApiPaymentAccounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = String(params.id || "").trim();
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let alive = true;
    const load = () => {
      Promise.all([publicApi.draw(id), publicApi.paymentAccounts()])
        .then(([d, accounts]) => {
          if (!alive) return;
          setApiDraw(d);
          setDraw(apiToDraw(d));
          setPaymentAccounts(accounts);
          setLoading(false);
          setNotFound(false);
        })
        .catch(() => {
          if (!alive) return;
          setNotFound(true);
          setLoading(false);
        });
    };
    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [params.id]);

  if (loading) return <LoadingDraw />;
  if (notFound || !draw || !apiDraw) return <NotFoundDraw />;

  const isCompleted = apiDraw.status === "drawn";
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/draws" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Back to Draws
          </Link>
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href);
              const text = encodeURIComponent(`🎟️ Check out this lucky draw: ${draw.title}! Enter now and win big at Kaptan Lucky Draw.`);
              window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
            }}
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 rounded-xl px-3 py-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </button>
        </div>
        <PrizeShowcase draw={draw} isCompleted={isCompleted} winner={apiDraw.winner ?? null} />
        {isCompleted ? <DrawClosedBanner winner={apiDraw.winner ?? null} /> : <JoinFlow draw={draw} drawId={apiDraw.id} paymentAccounts={paymentAccounts} />}
        <ParticipantsAndRules draw={draw} />
        <PreviousWinners />
        <OtherActiveDraws currentId={apiDraw.id} />
      </div>
      <SiteFooter />
    </div>
  );
}

function LoadingDraw() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground">
      <Navbar />
      <div className="container mx-auto px-6 pt-40 pb-32 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-pulse">
          <Ticket className="w-8 h-8 text-primary" />
        </div>
        <p className="text-zinc-400 text-sm">Loading draw details...</p>
      </div>
    </div>
  );
}

function NotFoundDraw() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground">
      <Navbar />
      <div className="container mx-auto px-6 pt-40 pb-32 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Info className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-heading text-white mb-2">Draw Not Found</h1>
        <p className="text-muted-foreground mb-8">This draw may have ended or the link is incorrect.</p>
        <Link href="/draws">
          <Button className="bg-primary text-black hover:bg-yellow-400 rounded-xl font-bold px-6 h-11">Browse Active Draws</Button>
        </Link>
      </div>
    </div>
  );
}

function JoinFlow({ draw, drawId, paymentAccounts }: { draw: Draw; drawId: string | number; paymentAccounts: ApiPaymentAccounts | null; }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<JoinStep>("tokens");
  const [qty, setQty] = useState(5);
  const [payMethod, setPayMethod] = useState<string>("EasyPaisa");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [txnId, setTxnId] = useState("");
  const [screenshot, setScreenshot] = useState<{ name: string; dataUrl: string } | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverTxnId, setServerTxnId] = useState<string | number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const total = qty * draw.tokenPrice;
  const currentIdx = STEP_ORDER.indexOf(step);
  const orderId = useMemo(() => `CLD-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, []);
  const tickets = useMemo(() => Array.from({ length: Math.min(qty, 8) }, () => `T-${Math.floor(100000 + Math.random() * 900000)}`), [qty]);

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "You need an account to continue",
        description: "Please create an account or login to continue.",
        action: <Button onClick={() => window.location.assign(`/auth?tab=signup&next=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="bg-primary text-black hover:bg-yellow-400">Go to Sign Up</Button>,
      });
      window.setTimeout(() => {
        window.location.assign(`/auth?tab=signup&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }, 1200);
    }
  }, [loading, user, toast]);

  const scrollToSection = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goTo = (s: JoinStep) => {
    setStep(s);
    setTimeout(scrollToSection, 50);
  };

  const handleProofSubmit = async () => {
    if (!user) {
      toast({
        title: "You need an account to continue",
        description: "Please create an account or login to continue.",
        action: <Button onClick={() => window.location.assign(`/auth?tab=signup&next=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="bg-primary text-black hover:bg-yellow-400">Go to Sign Up</Button>,
      });
      window.setTimeout(() => {
        window.location.assign(`/auth?tab=signup&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }, 1200);
      return;
    }
    setSubmitting(true);
    if (!txnId.trim()) {
      toast({
        title: "Transaction ID is required",
        description: "Please enter the transaction ID from your payment.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    if (!address.trim()) {
      toast({
        title: "Address is required",
        description: "Please enter your delivery or contact address.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    let screenshotUrl: string | undefined;
    if (screenshotFile) {
      const fd = new FormData();
      fd.append("image", screenshotFile);
      try {
        const res = await fetch("/api/upload/screenshot", {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("cld_token") ?? ""}` },
          body: fd,
        });
        const data = await res.json() as { url?: string };
        if (data.url) screenshotUrl = data.url;
      } catch { }
    }
    try {
      const result = await userApi.submitTransaction({
        amountPkr: total,
        tokensCount: qty,
        drawId,
        drawName: draw.title,
        paymentMethod: payMethod,
        screenshotUrl,
        transactionId: txnId.trim(),
        address: address.trim(),
        name: name.trim(),
        phone: phone.trim(),
      });
      setServerTxnId(result.id);
      goTo("pending");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit. Please try again.";
      toast({
        title: "Unable to continue",
        description: message === "Unauthorized" ? "Please login or create an account to continue" : message,
        action: <Button onClick={() => window.location.assign(`/auth?tab=signup&next=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="bg-primary text-black hover:bg-yellow-400">Go to Sign Up</Button>,
      });
      window.setTimeout(() => {
        window.location.assign(`/auth?tab=signup&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} id="buy" className="py-14 lg:py-20 bg-zinc-950/50 relative overflow-hidden border-y border-white/5">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Ticket className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Join This Draw</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold font-heading mb-2">
            Your <span className="text-primary">Winning Journey</span>
          </h2>
          <p className="text-zinc-400 text-sm mt-2">Login required to participate</p>
        </div>

        <div className="max-w-3xl mx-auto mb-8 md:mb-10">
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex items-center min-w-max mx-auto">
              {JOIN_STEPS.map((s, i) => {
                const sIdx = STEP_ORDER.indexOf(s.id);
                const done = currentIdx > sIdx;
                const active = s.id === step;
                return (
                  <div key={s.id} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all whitespace-nowrap ${active ? "border-primary bg-primary/10 text-primary" : done ? "border-primary/40 text-primary/70" : "border-white/10 text-zinc-500"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${done || active ? "bg-primary text-black" : "bg-white/10 text-zinc-400"}`}>
                        {done ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      {s.label}
                    </div>
                    {i < JOIN_STEPS.length - 1 && <div className={`w-4 md:w-6 h-px mx-1 ${done ? "bg-primary/40" : "bg-white/10"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {step === "tokens" && (
              <motion.div key="tokens" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <TokenStep draw={draw} qty={qty} setQty={setQty} total={total} onNext={() => goTo("payment")} />
              </motion.div>
            )}
            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <PaymentStep selectedMethod={payMethod} onSelectMethod={setPayMethod} accounts={paymentAccounts} onBack={() => goTo("tokens")} onNext={() => goTo("proof")} />
              </motion.div>
            )}
            {step === "proof" && (
              <motion.div key="proof" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <ProofStep
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                address={address}
                setAddress={setAddress}
                txnId={txnId}
                setTxnId={setTxnId}
                screenshot={screenshot}
                setScreenshot={setScreenshot}
                setScreenshotFile={setScreenshotFile}
                paymentMethod={payMethod}
                onBack={() => goTo("payment")}
                onNext={handleProofSubmit}
                submitting={submitting}
              />
              </motion.div>
            )}
            {step === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <PendingStep orderId={orderId} name={name} phone={phone} txnId={txnId} paymentMethod={payMethod} qty={qty} total={total} screenshot={screenshot} transactionId={serverTxnId} />
              </motion.div>
            )}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <SuccessStep orderId={orderId} qty={qty} tickets={tickets} onBuyMore={() => {
                  setStep("tokens");
                  setTxnId("");
                  setScreenshot(null);
                  setScreenshotFile(null);
                  setName("");
                  setPhone("");
                  setServerTxnId(null);
                  setTimeout(scrollToSection, 50);
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TokenStep({ draw, qty, setQty, total, onNext }: { draw: Draw; qty: number; setQty: (n: number) => void; total: number; onNext: () => void; }) {
  const effectiveMax = draw.maxPerUser > 0 ? draw.maxPerUser : 99999;
  const presets = [1, 5, 10, 25, 50, 100].filter((n) => n <= effectiveMax);
  const update = (n: number) => {
    if (!Number.isFinite(n) || n < 1) return setQty(1);
    setQty(Math.min(Math.floor(n), effectiveMax));
  };

  return (
    <div className="bg-gradient-to-br from-card to-zinc-950 border border-primary/25 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_-20px_rgba(255,215,0,0.2)]">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Quick Select</div>
      <div className="flex flex-wrap gap-2 mb-6">
        {presets.map((n) => (
          <button key={n} type="button" onClick={() => update(n)} className={`rounded-full px-3 py-1.5 text-sm font-bold transition-all ${qty === n ? "bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black shadow-[0_4px_12px_rgba(255,215,0,0.35)]" : "bg-white/5 border border-white/10 text-zinc-300 hover:border-primary/40 hover:text-primary"}`}>
            {n} {n === 1 ? "Token" : "Tokens"}
          </button>
        ))}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Number of Tokens</div>
      <div className="flex items-center justify-center gap-3 mb-2">
        <button type="button" onClick={() => update(qty - 1)} disabled={qty <= 1} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all">
          <Minus className="w-5 h-5" />
        </button>
        <Input type="number" value={qty} min={1} max={effectiveMax} onChange={(e) => update(Number(e.target.value))} className="h-14 w-28 text-center text-2xl font-bold font-heading text-white bg-black/40 border-white/10 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <button type="button" onClick={() => update(qty + 1)} disabled={qty >= effectiveMax} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center text-[11px] text-zinc-500 mb-4">{draw.maxPerUser > 0 ? `Max ${draw.maxPerUser} tokens per user for this draw` : "No token limit per user"}</p>
      <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between text-sm text-zinc-400 mb-1.5">
          <span>{qty} × PKR {draw.tokenPrice}</span>
          <span>Token Price</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total</span>
          <span className="text-3xl font-bold font-heading text-primary">PKR {(total ?? 0).toLocaleString()}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-zinc-400">
          <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>You'll receive <span className="font-bold text-white">{qty} unique entries</span> — each with an equal chance of winning.</span>
        </div>
      </div>
      <Button onClick={onNext} className="w-full bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 h-12 rounded-xl font-bold text-base shadow-[0_8px_24px_rgba(255,215,0,0.35)] group">
        Continue to Payment <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}

function PaymentStep({ selectedMethod, onSelectMethod, accounts, onBack, onNext }: { selectedMethod: string; onSelectMethod: (m: string) => void; accounts: ApiPaymentAccounts | null; onBack: () => void; onNext: () => void; }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const methods = [
    { name: "EasyPaisa", icon: Smartphone, account: accounts?.easypaisa?.number ?? "", holder: accounts?.easypaisa?.title ?? "Kaptan Lucky Draw" },
    { name: "JazzCash", icon: Smartphone, account: accounts?.jazzcash?.number ?? "", holder: accounts?.jazzcash?.title ?? "Kaptan Lucky Draw" },
    { name: "SadaPay", icon: Smartphone, account: accounts?.sadapay?.number ?? "", holder: accounts?.sadapay?.title ?? "Kaptan Lucky Draw" },
    { name: "Bank Transfer", icon: Landmark, account: accounts?.bank?.iban ?? "", holder: accounts?.bank?.title ?? "Kaptan Lucky Draw" },
  ].filter((m) => m.account);

  return (
    <div className="bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 md:p-7 space-y-5">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Select Payment Method</div>
        <div className="space-y-2.5">
            {methods.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">Payment details are being updated. Please try again later.</div>
            ) : (
              methods.map((m) => {
                const active = selectedMethod === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => onSelectMethod(m.name)}
                    className={`w-full rounded-2xl border p-4 flex items-center gap-4 text-left transition-all ${active ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20"}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center"><m.icon className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{m.name}</div>
                      <div className="text-xs text-zinc-400 truncate">{m.holder}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs text-zinc-500 font-mono truncate">{m.account}</div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copy(m.account, m.name); }}
                          className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/6 text-xs text-zinc-200 hover:bg-white/10"
                          aria-label={`Copy ${m.name} account`}
                        >
                          {copied === m.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? "border-primary bg-primary text-black" : "border-white/20"}`}>{active ? <Check className="w-3 h-3" /> : null}</div>
                  </button>
                );
              })
            )}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11 rounded-xl border-white/10 bg-transparent hover:bg-white/5">Back</Button>
        <Button onClick={onNext} className="flex-1 h-11 rounded-xl bg-primary text-black hover:bg-yellow-400">Continue</Button>
      </div>
    </div>
  );
}

function ProofStep({ name, setName, phone, setPhone, address, setAddress, txnId, setTxnId, screenshot, setScreenshot, setScreenshotFile, paymentMethod, onBack, onNext, submitting }: { name: string; setName: (v: string) => void; phone: string; setPhone: (v: string) => void; address: string; setAddress: (v: string) => void; txnId: string; setTxnId: (v: string) => void; screenshot: { name: string; dataUrl: string } | null; setScreenshot: (v: { name: string; dataUrl: string } | null) => void; setScreenshotFile: (v: File | null) => void; paymentMethod: string; onBack: () => void; onNext: () => void; submitting: boolean; }) {
  const onFile = (file: File | null) => {
    if (!file) {
      setScreenshot(null);
      setScreenshotFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot({ name: file.name, dataUrl: String(reader.result) });
      setScreenshotFile(file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 md:p-7 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Full Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-black/30 border-white/10 text-white" placeholder="Enter your name" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Phone Number</div>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl bg-black/30 border-white/10 text-white" placeholder="03XX XXXXXXX" />
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Address</div>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={4}
          placeholder="Enter your street address, city and region"
          className="w-full rounded-2xl bg-black/30 border border-white/10 text-white px-4 py-3 text-sm resize-none focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
        />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Transaction ID</div>
        <Input value={txnId} onChange={(e) => setTxnId(e.target.value)} className="h-12 rounded-xl bg-black/30 border-white/10 text-white" placeholder="Enter payment transaction ID" />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Payment Screenshot</div>
        <label className="block rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 cursor-pointer hover:bg-white/[0.07]">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold text-white">{screenshot ? screenshot.name : "Upload screenshot"}</div>
              <div className="text-xs text-zinc-400">PNG, JPG up to 5 MB</div>
            </div>
          </div>
        </label>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-11 rounded-xl border-white/10 bg-transparent hover:bg-white/5">Back</Button>
        <Button onClick={onNext} disabled={submitting} className="flex-1 h-11 rounded-xl bg-primary text-black hover:bg-yellow-400 disabled:opacity-60">{submitting ? "Submitting..." : `Submit ${paymentMethod}`}</Button>
      </div>
    </div>
  );
}

function PendingStep({ orderId, name, phone, txnId, paymentMethod, qty, total, screenshot, transactionId }: { orderId: string; name: string; phone: string; txnId: string; paymentMethod: string; qty: number; total: number; screenshot: { name: string; dataUrl: string } | null; transactionId: number | null; }) {
  return (
    <div className="bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"><Hourglass className="w-8 h-8 text-primary" /></div>
      <div>
        <h3 className="text-2xl font-bold text-white">Payment submitted</h3>
        <p className="text-zinc-400 text-sm mt-1">Your request is pending verification.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-2 text-sm text-zinc-300">
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Order</span><span className="font-mono">{orderId}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Name</span><span>{name}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Phone</span><span>{phone}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Txn</span><span>{txnId}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Method</span><span>{paymentMethod}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Tokens</span><span>{qty}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Amount</span><span>Rs. {(total ?? 0).toLocaleString()}</span></div>
        <div className="flex justify-between gap-4"><span className="text-zinc-500">Submission</span><span>{transactionId ? `#${transactionId}` : "Local"}</span></div>
        {screenshot && <div className="text-xs text-zinc-500">Screenshot attached: {screenshot.name}</div>}
      </div>
    </div>
  );
}

function SuccessStep({ orderId, qty, tickets, onBuyMore }: { orderId: string; qty: number; tickets: string[]; onBuyMore: () => void; }) {
  return (
    <div className="bg-gradient-to-br from-card to-zinc-950 border border-emerald-500/20 rounded-3xl p-6 md:p-8 text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400" />
      <h3 className="text-2xl font-bold text-white">Success</h3>
      <p className="text-zinc-400 text-sm">You now have {qty} entries.</p>
      <div className="flex flex-wrap justify-center gap-2">
        {tickets.map((t) => <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">{t}</span>)}
      </div>
      <Button onClick={onBuyMore} className="bg-primary text-black hover:bg-yellow-400 rounded-xl">Buy More</Button>
    </div>
  );
}

function DrawClosedBanner({ winner }: { winner: { name: string; city?: string } | null }) {
  return (
    <section className="py-14 border-y border-white/5 bg-zinc-950/60">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <Trophy className="w-10 h-10 mx-auto text-primary mb-3" />
          <h2 className="text-2xl font-bold text-white">This draw has ended</h2>
          <p className="text-zinc-400 mt-2">Winner: {winner?.name ?? "To be announced"}</p>
        </div>
      </div>
    </section>
  );
}

function PrizeShowcase({ draw }: { draw: Draw; isCompleted: boolean; winner: { name: string; city?: string } | null; }) {
  return (
    <section className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Premium Draw
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{draw.title}</h1>
          <p className="text-zinc-400 max-w-2xl">{draw.tagline}</p>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">PKR {(draw.prizeValue ?? 0).toLocaleString()}</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">PKR {draw.tokenPrice} / token</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">{(draw.soldTokens ?? 0).toLocaleString()} sold</div>
          </div>
        </div>
        <div className="lg:col-span-5">
        <img src={fixImageUrl(draw.image) ?? ""} alt={draw.title} className="w-full rounded-3xl border border-white/10 object-cover aspect-[4/3]" />
        </div>
      </div>
    </section>
  );
}

function ParticipantsAndRules({ draw }: { draw: Draw; }) {
  return <section className="container mx-auto px-4 md:px-6 py-10 text-zinc-400">Draw participants and rules</section>;
}

function PreviousWinners() {
  return <section className="container mx-auto px-4 md:px-6 py-10 text-zinc-400">Previous winners</section>;
}

function OtherActiveDraws({ currentId }: { currentId: number; }) {
  return <section className="container mx-auto px-4 md:px-6 py-10 text-zinc-400">Other active draws</section>;
}
