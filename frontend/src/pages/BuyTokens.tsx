import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Crown,
  ArrowLeft,
  ArrowRight,
  Ticket,
  Shield,
  Lock,
  Sparkles,
  Star,
  CheckCircle2,
  Copy,
  Landmark,
  Smartphone,
  CreditCard,
  Trophy,
  Wand2,
  Info,
  Upload,
  Hourglass,
  ClipboardList,
  Pencil,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/lib/api";

type Bundle = {
  id: string;
  price: number;
  tokens: number;
  bonus: number;
  badge?: "popular" | "best" | "vip";
  perk: string;
};

const BUNDLES: Bundle[] = [
  { id: "starter", price: 100, tokens: 1, bonus: 0, perk: "1 entry into any active draw" },
  { id: "lucky", price: 500, tokens: 6, bonus: 1, perk: "6 tokens for your account" },
  { id: "gold", price: 1000, tokens: 13, bonus: 3, badge: "popular", perk: "13 tokens for your account" },
  { id: "platinum", price: 5000, tokens: 75, bonus: 25, badge: "best", perk: "75 tokens for your account" },
  { id: "captain", price: 10000, tokens: 160, bonus: 60, badge: "vip", perk: "160 tokens for your account" },
];

const PAYMENT_METHODS = [
  {
    id: "jazzcash",
    name: "JazzCash",
    description: "Instant — pay with your mobile wallet",
    icon: "jazz",
    field: "Mobile Number",
    placeholder: "03XX XXXXXXX",
  },
  {
    id: "easypaisa",
    name: "easypaisa",
    description: "Instant — pay with your easypaisa account",
    icon: "ep",
    field: "Mobile Number",
    placeholder: "03XX XXXXXXX",
  },
  {
    id: "sadapay",
    name: "SadaPay",
    description: "Instant — pay with your SadaPay debit card",
    icon: "sp",
    field: "Card Number",
    placeholder: "1234 5678 9012 3456",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "1–2 hours — IBFT to our verified account",
    icon: "bank",
    field: "Account Number",
    placeholder: "PK00ABCD0000000000000000",
  },
] as const;

type PaymentMethodId = typeof PAYMENT_METHODS[number]["id"];

type Step = "select" | "payment" | "details" | "instructions" | "pending" | "success";
type Mode = "bundle" | "custom";
type SubmissionStatus = "pending" | "approved" | "rejected";

type PaymentSubmission = {
  orderId: string;
  name: string;
  phone: string;
  transactionId: string;
  screenshotName: string;
  screenshotDataUrl: string;
  tokens: number;
  price: number;
  method: string;
  status: SubmissionStatus;
  createdAt: number;
};

type AccountInfo = { title: string; number: string };
type AccountState = {
  easypaisa: AccountInfo;
  jazzcash: AccountInfo;
  bank: AccountInfo;
};

const DEFAULT_ACCOUNTS: AccountState = {
  easypaisa: { title: "Kaptan Lucky Draw (Pvt) Ltd", number: "0300 1234567" },
  jazzcash: { title: "Kaptan Lucky Draw (Pvt) Ltd", number: "0301 7654321" },
  bank: { title: "Kaptan Lucky Draw (Pvt) Ltd", number: "PK36 SCBL 0000 0011 2345 6702" },
};

const SUBMISSION_STORAGE_KEY = "cld_payment_submissions";

function BrandMark({ id }: { id: string }) {
  if (id === "jazz") {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#E11D48] flex items-center justify-center font-bold text-white text-[10px] leading-none px-2 shadow-inner shadow-black/20">
        <span className="italic">Jazz</span>
      </div>
    );
  }
  if (id === "ep") {
    return (
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center px-2">
        <span className="font-extrabold text-[10px] text-[#00A651] leading-none">easypaisa</span>
      </div>
    );
  }
  if (id === "sp") {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#0E1116] flex items-center justify-center text-[#FF7A1A] font-extrabold text-[10px] border border-white/10">
        SADA
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl bg-[#1A1A24] border border-white/10 flex items-center justify-center text-[#FFD700]">
      <Landmark className="w-5 h-5" />
    </div>
  );
}

function MethodIcon({ id }: { id: PaymentMethodId }) {
  if (id === "bank") return <Landmark className="w-5 h-5 text-[#FFD700]" />;
  if (id === "sadapay") return <CreditCard className="w-5 h-5 text-[#FFD700]" />;
  return <Smartphone className="w-5 h-5 text-[#FFD700]" />;
}

function generateOrderId() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CLD-${part()}-${part()}`;
}

function generateTicketNumbers(count: number) {
  const digits = () => Math.floor(100000 + Math.random() * 900000);
  return Array.from({ length: count }, () => `T-${digits()}`);
}

export default function BuyTokens() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("gold");
  const [step, setStep] = useState<Step>("select");
  const [paymentId, setPaymentId] = useState<PaymentMethodId>("jazzcash");
  const [accountValue, setAccountValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [orderId] = useState(generateOrderId());
  const [mode, setMode] = useState<Mode>("bundle");
  const [customTokensStr, setCustomTokensStr] = useState("");
  const [accounts, setAccounts] = useState<AccountState>(DEFAULT_ACCOUNTS);
  const [transactionId, setTransactionId] = useState("");
  const [address, setAddress] = useState("");
  const [screenshot, setScreenshot] = useState<{ name: string; dataUrl: string } | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("pending");

  const selected = useMemo(() => BUNDLES.find((b) => b.id === selectedId)!, [selectedId]);
  const pricePerToken = useMemo(
    () => selected.price / (selected.tokens + selected.bonus),
    [selected]
  );
  const customTokens = Math.max(0, Math.floor(Number(customTokensStr) || 0));
  const customPrice = Math.round(customTokens * pricePerToken);

  const orderTokens = mode === "custom" ? customTokens : selected.tokens + selected.bonus;
  const orderPrice = mode === "custom" ? customPrice : selected.price;
  const orderBonus = mode === "custom" ? 0 : selected.bonus;
  const orderLabel = mode === "custom" ? "Custom" : selected.id;

  const totalTokens = orderTokens;
  const tickets = useMemo(() => generateTicketNumbers(Math.min(totalTokens, 8)), [totalTokens]);

  const selectBundle = (id: string) => {
    setSelectedId(id);
    setMode("bundle");
  };

  const handleCustomTokensChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    setCustomTokensStr(cleaned);
    if (cleaned !== "") setMode("custom");
  };

  const proceedWithCustom = () => {
    if (customTokens < 1) {
      toast({
        title: "Enter a token amount",
        description: "Please enter at least 1 token to continue.",
        variant: "destructive",
      });
      return;
    }
    setMode("custom");
    setStep("payment");
  };

  const goToPayment = () => setStep("payment");
  const goToDetails = () => setStep("details");
  const goBack = () => {
    if (step === "payment") setStep("select");
    else if (step === "details") setStep("payment");
    else if (step === "instructions") setStep("details");
  };

  const submitPayment = () => {
    if (!accountValue.trim() || !fullName.trim()) {
      toast({
        title: "Almost there",
        description: "Please enter your name and payment details to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep("instructions");
  };

  const updateAccount = (id: keyof AccountState, field: keyof AccountInfo, value: string) => {
    setAccounts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleScreenshotUpload = (file: File | null) => {
    if (!file) {
      setScreenshot(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image (PNG, JPG, etc.).",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Screenshot must be under 5 MB.",
        variant: "destructive",
      });
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot({ name: file.name, dataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const submitProof = async () => {
    if (!fullName.trim() || !accountValue.trim()) {
      toast({
        title: "Missing details",
        description: "Name and phone number are required.",
        variant: "destructive",
      });
      return;
    }
    if (!transactionId.trim()) {
      toast({
        title: "Transaction ID required",
        description: "Please enter the transaction ID from your payment.",
        variant: "destructive",
      });
      return;
    }
    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your delivery or contact address.",
        variant: "destructive",
      });
      return;
    }
    if (!screenshot) {
      toast({
        title: "Screenshot required",
        description: "Please upload a screenshot of your payment.",
        variant: "destructive",
      });
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
      } catch { /* proceed without URL */ }
    }

    try {
      await userApi.submitTransaction({
        amountPkr: orderPrice,
        tokensCount: orderTokens,
        paymentMethod: PAYMENT_METHODS.find((m) => m.id === paymentId)?.name ?? paymentId,
        screenshotUrl,
        transactionId: transactionId.trim(),
        address: address.trim(),
        name: fullName.trim(),
        phone: accountValue.trim(),
      });
    } catch (err: unknown) {
      toast({
        title: "Failed to submit",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmissionStatus("pending");
    setStep("pending");
  };

  const approveSubmission = () => {
    setSubmissionStatus("approved");
    setStep("success");
  };

  const copyOrder = async () => {
    await navigator.clipboard.writeText(orderId);
    toast({ title: "Order ID copied", description: orderId });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,215,0,0.10)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_60%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 container mx-auto px-4 md:px-6 pt-32 pb-24">
        {/* Page header */}
        <div className="max-w-3xl mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#FFD700] transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#111118] border border-[#FFD700]/30 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#FFD700]">Token Store</span>
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-[56px] leading-[1.05] tracking-tight">
            Pick a bundle.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
              Win the prize.
            </span>
          </h1>
          <p className="text-zinc-400 mt-4 text-lg max-w-2xl">
            Every token is one entry into the live draws. Bigger bundles unlock bonus tokens and VIP-only prizes.
          </p>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        <div className="grid lg:grid-cols-12 gap-8 mt-10">
          {/* Left: Steps */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {BUNDLES.map((b) => (
                      <BundleCard
                        key={b.id}
                        bundle={b}
                        selected={mode === "bundle" && selectedId === b.id}
                        onSelect={() => selectBundle(b.id)}
                      />
                    ))}
                  </div>

                  <CustomTokensCard
                    value={customTokensStr}
                    tokens={customTokens}
                    price={customPrice}
                    pricePerToken={pricePerToken}
                    selectedBundleId={selected.id}
                    active={mode === "custom"}
                    onChange={handleCustomTokensChange}
                    onProceed={proceedWithCustom}
                  />
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {PAYMENT_METHODS.map((m) => {
                    const active = paymentId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentId(m.id)}
                        className={`w-full text-left rounded-2xl border transition-all p-5 flex items-center gap-5 ${
                          active
                            ? "border-[#FFD700] bg-[#FFD700]/5 shadow-[0_0_30px_rgba(255,215,0,0.15)]"
                            : "border-white/10 bg-[#111118] hover:border-white/20 hover:bg-[#15151f]"
                        }`}
                      >
                        <BrandMark id={m.icon} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{m.name}</span>
                            {active && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black bg-[#FFD700] rounded-full px-2 py-0.5">
                                <Check className="w-3 h-3" /> Selected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mt-0.5">{m.description}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${active ? "border-[#FFD700] bg-[#FFD700]" : "border-zinc-600"}`}>
                          {active && <Check className="w-3 h-3 text-black m-0.5" />}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="bg-[#111118] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6"
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                    <MethodIcon id={paymentId} />
                    <div>
                      <p className="font-semibold text-white">
                        Paying with {PAYMENT_METHODS.find((m) => m.id === paymentId)?.name}
                      </p>
                      <p className="text-xs text-zinc-500">Your details are encrypted in transit</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                      <Input
                        id="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="As shown on your ID"
                        className="bg-[#0a0a0f] border-white/10 text-white h-12 focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account" className="text-zinc-300">
                        {PAYMENT_METHODS.find((m) => m.id === paymentId)?.field}
                      </Label>
                      <Input
                        id="account"
                        value={accountValue}
                        onChange={(e) => setAccountValue(e.target.value)}
                        placeholder={PAYMENT_METHODS.find((m) => m.id === paymentId)?.placeholder}
                        className="bg-[#0a0a0f] border-white/10 text-white h-12 focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0a0a0f] border border-white/5 p-4 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
                    <div className="text-sm text-zinc-400">
                      <span className="text-white font-medium">Your safety is our priority.</span> We never store your full
                      payment details. Tokens are credited instantly after confirmation.
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "instructions" && (
                <motion.div
                  key="instructions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <PaymentInstructions
                    accounts={accounts}
                    onChange={updateAccount}
                    orderPrice={orderPrice}
                    orderId={orderId}
                  />

                  <PaymentProofForm
                    name={fullName}
                    phone={accountValue}
                    address={address}
                    setAddress={setAddress}
                    transactionId={transactionId}
                    screenshot={screenshot}
                    onTransactionIdChange={setTransactionId}
                    onScreenshotChange={handleScreenshotUpload}
                    onSubmit={submitProof}
                  />
                </motion.div>
              )}

              {step === "pending" && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="bg-[#111118] border border-white/10 rounded-2xl p-10 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-16 h-16 mx-auto rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center mb-5"
                    >
                      <Hourglass className="w-7 h-7 text-[#FFD700]" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">Payment submitted. Waiting for verification.</h3>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto">
                      We've received your payment proof. Our team will verify it shortly and credit your tokens once approved.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 bg-[#0a0a0f] border border-white/10 rounded-full px-4 py-2">
                      <span className="text-xs text-zinc-500">Order ID</span>
                      <span className="text-sm font-mono text-white">{orderId}</span>
                      <button onClick={copyOrder} className="text-zinc-500 hover:text-[#FFD700] transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111118] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="w-4 h-4 text-[#FFD700]" />
                      <span className="font-semibold text-sm">Submission summary</span>
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full px-2 py-0.5">
                        <Hourglass className="w-3 h-3" /> Pending
                      </span>
                    </div>
                    <SummaryRow label="Name" value={fullName} />
                    <SummaryRow label="Phone" value={accountValue} />
                    <SummaryRow label="Transaction ID" value={transactionId} />
                    <SummaryRow label="Method" value={PAYMENT_METHODS.find((m) => m.id === paymentId)?.name ?? ""} />
                    <SummaryRow label="Tokens" value={`${(orderTokens ?? 0).toLocaleString()} tokens`} />
                    <SummaryRow label="Amount" value={`Rs. ${(orderPrice ?? 0).toLocaleString()}`} />
                    {screenshot && (
                      <div className="pt-3 border-t border-white/5">
                        <p className="text-xs text-zinc-500 mb-2">Attached screenshot</p>
                        <div className="flex items-center gap-3">
                          <img
                            src={screenshot.dataUrl}
                            alt="Payment screenshot"
                            className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          />
                          <span className="text-sm text-zinc-300 truncate">{screenshot.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0a0a0f] border border-dashed border-white/10 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-500 flex-1">
                      <span className="text-zinc-400 font-medium">Admin verification placeholder.</span>{" "}
                      In production, an admin reviews each submission before approving. For this preview you can simulate the approval.
                      <div className="mt-3">
                        <Button
                          onClick={approveSubmission}
                          variant="outline"
                          className="h-9 border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/10 bg-transparent rounded-lg text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Simulate admin approval
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-2xl p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FFE680] to-[#FFB800] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(255,215,0,0.4)]"
                    >
                      <CheckCircle2 className="w-10 h-10 text-black" />
                    </motion.div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 mb-3">
                      <Check className="w-3 h-3" /> Payment verified
                    </div>
                    <h2 className="text-3xl font-bold font-heading mb-2">You're in the draw!</h2>
                    <p className="text-zinc-400 max-w-md mx-auto">
                      We've added <span className="text-[#FFD700] font-bold">{totalTokens} tokens</span> to your account.
                      Each one is one shot at the prize.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 bg-[#0a0a0f] border border-white/10 rounded-full px-4 py-2">
                      <span className="text-xs text-zinc-500">Order ID</span>
                      <span className="text-sm font-mono text-white">{orderId}</span>
                      <button onClick={copyOrder} className="text-zinc-500 hover:text-[#FFD700] transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111118] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Ticket className="w-4 h-4 text-[#FFD700]" />
                      <h3 className="font-semibold">Your ticket numbers</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {tickets.map((t) => (
                        <div
                          key={t}
                          className="bg-[#0a0a0f] border border-[#FFD700]/20 rounded-xl py-3 px-2 text-center font-mono text-sm text-[#FFD700]"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                    {totalTokens > tickets.length && (
                      <p className="text-xs text-zinc-500 mt-3 text-center">
                        + {totalTokens - tickets.length} more tickets in your dashboard
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setLocation("/")}
                      className="flex-1 bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 rounded-xl font-bold h-12 shadow-[0_8px_30px_rgba(255,215,0,0.35)] border-none"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      View live draws
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("select");
                        setAccountValue("");
                        setFullName("");
                        setTransactionId("");
                        setScreenshot(null);
                        setSubmissionStatus("pending");
                      }}
                      className="flex-1 border-2 border-[#FFD700]/60 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-xl font-semibold h-12 bg-transparent"
                    >
                      Buy more tokens
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Sticky summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-28">
              <OrderSummary
                mode={mode}
                label={orderLabel}
                tokens={orderTokens}
                bonus={orderBonus}
                price={orderPrice}
                step={step}
                paymentName={PAYMENT_METHODS.find((m) => m.id === paymentId)?.name}
                onPrimary={
                  step === "select"
                    ? mode === "custom"
                      ? proceedWithCustom
                      : goToPayment
                    : step === "payment"
                    ? goToDetails
                    : step === "details"
                    ? submitPayment
                    : undefined
                }
                onBack={
                  step === "payment" || step === "details" || step === "instructions"
                    ? goBack
                    : undefined
                }
              />

              {/* Trust strip */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: "Verified" },
                  { icon: Lock, label: "Encrypted" },
                  { icon: Crown, label: "Licensed" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="bg-[#111118] border border-white/5 rounded-xl py-3 flex flex-col items-center gap-1"
                  >
                    <Icon className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "select", label: "Choose bundle" },
    { id: "payment", label: "Payment method" },
    { id: "details", label: "Your details" },
    { id: "instructions", label: "Verify payment" },
    { id: "success", label: "Confirmation" },
  ];
  const order = ["select", "payment", "details", "instructions", "pending", "success"];
  const currentIdx = order.indexOf(step);

  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2">
      {steps.map((s, i) => {
        const sIdx = order.indexOf(s.id);
        const done = currentIdx > sIdx || (s.id === "success" && step === "success");
        const active =
          s.id === step ||
          (s.id === "success" && step === "success") ||
          (s.id === "instructions" && step === "pending");
        return (
          <div key={s.id} className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                active
                  ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
                  : done
                  ? "border-[#FFD700]/40 bg-transparent text-[#FFD700]/80"
                  : "border-white/10 text-zinc-500"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  done || active ? "bg-[#FFD700] text-black" : "bg-white/10 text-zinc-400"
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="text-xs font-semibold whitespace-nowrap">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`w-4 sm:w-8 h-px ${done ? "bg-[#FFD700]/40" : "bg-white/10"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function BundleCard({
  bundle,
  selected,
  onSelect,
}: {
  bundle: Bundle;
  selected: boolean;
  onSelect: () => void;
}) {
  const total = bundle.tokens + bundle.bonus;
  const pricePerToken = (bundle.price / total).toFixed(2);

  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onSelect}
      className={`relative text-left rounded-2xl border-2 transition-all p-5 overflow-hidden group ${
        selected
          ? "border-[#FFD700] bg-gradient-to-br from-[#FFD700]/10 to-transparent shadow-[0_0_40px_rgba(255,215,0,0.2)]"
          : "border-white/10 bg-[#111118] hover:border-white/20"
      }`}
    >
      {bundle.badge && (
        <div
          className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl ${
            bundle.badge === "popular"
              ? "bg-[#FFD700] text-black"
              : bundle.badge === "best"
              ? "bg-gradient-to-r from-[#FFE066] to-[#FFB800] text-black"
              : "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white"
          }`}
        >
          {bundle.badge === "popular" ? "Most popular" : bundle.badge === "best" ? "Best value" : "VIP"}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
          <Ticket className="w-4 h-4 text-[#FFD700]" />
        </div>
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">{bundle.id}</span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-xs text-zinc-500">Rs.</span>
        <span className="text-3xl font-bold text-white">{(bundle.price ?? 0).toLocaleString()}</span>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] to-[#FFB800]">
          {total} tokens
        </span>
        {bundle.bonus > 0 && (
          <span className="text-xs text-emerald-400 font-semibold">+{bundle.bonus} bonus</span>
        )}
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed mb-4 min-h-[40px]">{bundle.perk}</p>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-[11px] text-zinc-500">Rs. {pricePerToken} / token</span>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected ? "border-[#FFD700] bg-[#FFD700]" : "border-zinc-600"
        }`}>
          {selected && <Check className="w-3 h-3 text-black" />}
        </div>
      </div>
    </motion.button>
  );
}

function OrderSummary({
  mode,
  label,
  tokens,
  bonus,
  price,
  step,
  paymentName,
  onPrimary,
  onBack,
}: {
  mode: Mode;
  label: string;
  tokens: number;
  bonus: number;
  price: number;
  step: Step;
  paymentName?: string;
  onPrimary?: () => void;
  onBack?: () => void;
}) {
  const fee = 0;
  const grand = price + fee;
  const isEmptyCustom = mode === "custom" && tokens === 0;

  const primaryLabel =
    step === "select"
      ? mode === "custom"
        ? "Proceed with Custom Tokens"
        : "Continue to payment"
      : step === "payment"
      ? "Continue"
      : step === "details"
      ? "Pay now"
      : "";

  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
          <span className="font-semibold">Order Summary</span>
        </div>
        {mode === "custom" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black bg-[#FFD700] rounded-full px-2 py-0.5">
            <Wand2 className="w-3 h-3" /> Custom
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              {mode === "custom" ? "Custom tokens" : `${label} bundle`}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={`tokens-${tokens}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="font-bold text-white text-lg mt-0.5"
              >
                {isEmptyCustom ? "—" : `${(tokens ?? 0).toLocaleString()} tokens`}
              </motion.p>
            </AnimatePresence>
            {bonus > 0 && (
              <p className="text-xs text-emerald-400 mt-0.5">includes +{bonus} bonus</p>
            )}
          </div>
          <div className="text-right">
            <AnimatePresence mode="wait">
              <motion.p
                key={`price-${price}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="font-bold text-white text-lg"
              >
                Rs. {(price ?? 0).toLocaleString()}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="border-t border-dashed border-white/10 pt-4 space-y-2 text-sm">
          <Row label="Subtotal" value={`Rs. ${(price ?? 0).toLocaleString()}`} />
          <Row label="Processing fee" value="Free" valueClass="text-emerald-400 font-medium" />
          {paymentName && step !== "select" && <Row label="Method" value={paymentName} />}
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400">You pay</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={`grand-${grand}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] to-[#FFB800]"
            >
              Rs. {(grand ?? 0).toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </div>

        {onPrimary && (
          <div className="pt-2 space-y-2">
            <Button
              onClick={onPrimary}
              disabled={isEmptyCustom && step === "select"}
              className="w-full bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 hover:scale-[1.01] transition-all rounded-xl font-bold h-12 shadow-[0_8px_30px_rgba(255,215,0,0.35)] border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                className="w-full text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-10 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTokensCard({
  value,
  tokens,
  price,
  pricePerToken,
  selectedBundleId,
  active,
  onChange,
  onProceed,
}: {
  value: string;
  tokens: number;
  price: number;
  pricePerToken: number;
  selectedBundleId: string;
  active: boolean;
  onChange: (raw: string) => void;
  onProceed: () => void;
}) {
  const hasInput = tokens > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className={`mt-6 relative rounded-2xl border-2 transition-all p-5 sm:p-6 overflow-hidden backdrop-blur-sm ${
        active
          ? "border-[#FFD700] bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent shadow-[0_0_40px_rgba(255,215,0,0.18)]"
          : "border-white/10 bg-[#111118]/80 hover:border-white/20"
      }`}
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[radial-gradient(circle,rgba(255,215,0,0.18)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">Custom Tokens</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Pick the exact amount that suits you</p>
          </div>
        </div>
        {active && (
          <span className="inline-flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black bg-[#FFD700] rounded-full px-2 py-0.5">
            <Check className="w-3 h-3" /> Active
          </span>
        )}
      </div>

      <div className="relative grid md:grid-cols-2 gap-5 items-end">
        <div className="space-y-2">
          <Label htmlFor="custom-tokens" className="text-zinc-300 text-sm">
            Number of tokens
          </Label>
          <div className="relative">
            <Input
              id="custom-tokens"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E" || e.key === ".") {
                  e.preventDefault();
                }
              }}
              placeholder="Enter number of tokens"
              className="bg-[#0a0a0f] border-white/10 text-white h-12 pr-16 focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-500">
              <Ticket className="w-3.5 h-3.5 text-[#FFD700]" />
              tokens
            </div>
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-zinc-500">
            <Info className="w-3 h-3 mt-0.5 shrink-0 text-[#FFD700]/70" />
            <span>
              1 token = Rs. {pricePerToken.toFixed(2)} — dynamic price based on selected{" "}
              <span className="text-zinc-400 font-medium uppercase">{selectedBundleId}</span> bundle
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#0a0a0f] border border-white/5 p-4 flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Live total</span>
          <div className="flex items-baseline gap-2 mt-1 min-h-[36px]">
            <span className="text-xs text-zinc-500">Rs.</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`custom-price-${price}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] to-[#FFB800]"
              >
                {hasInput ? (price ?? 0).toLocaleString() : "0"}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={`custom-tokens-${tokens}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-zinc-400 mt-1"
            >
              {hasInput ? `${tokens.toLocaleString()} tokens × Rs. ${pricePerToken.toFixed(2)}` : "Enter tokens to see total"}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <Button
        onClick={onProceed}
        disabled={!hasInput}
        className="relative mt-5 w-full sm:w-auto bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 hover:scale-[1.01] transition-all rounded-xl font-bold h-11 px-6 shadow-[0_8px_30px_rgba(255,215,0,0.35)] border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Proceed with Custom Tokens
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`text-white ${valueClass}`}>{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white font-medium text-right break-all">{value || "—"}</span>
    </div>
  );
}

const ACCOUNT_DEFS: {
  id: keyof AccountState;
  name: string;
  brandId: string;
  titleLabel: string;
  numberLabel: string;
}[] = [
  { id: "easypaisa", name: "Easypaisa", brandId: "ep", titleLabel: "Account Name", numberLabel: "Mobile Number" },
  { id: "jazzcash", name: "JazzCash", brandId: "jazz", titleLabel: "Account Name", numberLabel: "Mobile Number" },
  { id: "bank", name: "SadaPay / Bank", brandId: "bank", titleLabel: "Account Title", numberLabel: "IBAN / Account Number" },
];

function PaymentInstructions({
  accounts,
  onChange,
  orderPrice,
  orderId,
}: {
  accounts: AccountState;
  onChange: (id: keyof AccountState, field: keyof AccountInfo, value: string) => void;
  orderPrice: number;
  orderId: string;
}) {
  const { toast } = useToast();
  const copyValue = async (label: string, value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied`, description: value });
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">Payment Instructions</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pay <span className="text-[#FFD700] font-semibold">Rs. {orderPrice.toLocaleString()}</span> to any account below
            </p>
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 bg-[#0a0a0f] border border-white/10 rounded-full px-3 py-1.5 shrink-0">
          <span className="text-[10px] text-zinc-500">Order</span>
          <span className="text-xs font-mono text-white">{orderId}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {ACCOUNT_DEFS.map((def) => {
          const acct = accounts[def.id];
          return (
            <div
              key={def.id}
              className="rounded-xl border border-white/10 bg-[#0a0a0f] p-4 space-y-3 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BrandMark id={def.brandId} />
                <div className="flex-1">
                  <p className="font-semibold text-white">{def.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">Editable details</p>
                </div>
                <Pencil className="w-3.5 h-3.5 text-zinc-600" />
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">{def.titleLabel}</Label>
                  <div className="relative">
                    <Input
                      value={acct.title}
                      onChange={(e) => onChange(def.id, "title", e.target.value)}
                      className="bg-[#111118] border-white/10 text-white h-10 pr-9 text-sm focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
                    />
                    <button
                      type="button"
                      onClick={() => copyValue(def.titleLabel, acct.title)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-[#FFD700] transition-colors"
                      aria-label={`Copy ${def.titleLabel}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">{def.numberLabel}</Label>
                  <div className="relative">
                    <Input
                      value={acct.number}
                      onChange={(e) => onChange(def.id, "number", e.target.value)}
                      className="bg-[#111118] border-white/10 text-white h-10 pr-9 text-sm font-mono focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
                    />
                    <button
                      type="button"
                      onClick={() => copyValue(def.numberLabel, acct.number)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-[#FFD700] transition-colors"
                      aria-label={`Copy ${def.numberLabel}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
          <div className="text-sm text-zinc-300 leading-relaxed">
            <p className="font-semibold text-white mb-2">After payment, submit:</p>
            <ul className="space-y-1 text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFD700]" /> Name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFD700]" /> Phone Number
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFD700]" /> Transaction ID
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFD700]" /> Payment Screenshot
              </li>
            </ul>
            <p className="mt-3 text-xs text-[#FFD700]/90 font-medium">
              Tokens will be added AFTER verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentProofForm({
  name,
  phone,
  transactionId,
  address,
  setAddress,
  screenshot,
  onTransactionIdChange,
  onScreenshotChange,
  onSubmit,
}: {
  name: string;
  phone: string;
  transactionId: string;
  address: string;
  setAddress: (v: string) => void;
  screenshot: { name: string; dataUrl: string } | null;
  onTransactionIdChange: (v: string) => void;
  onScreenshotChange: (file: File | null) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
          <Upload className="w-5 h-5 text-[#FFD700]" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">Submit Payment Proof</h3>
          <p className="text-xs text-zinc-500 mt-0.5">All fields are required for verification</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="proof-name" className="text-zinc-300">Name</Label>
          <Input
            id="proof-name"
            value={name}
            readOnly
            placeholder="Prefilled from your details"
            className="bg-[#0a0a0f] border-white/10 text-zinc-300 h-12 cursor-not-allowed"
          />
          <p className="text-[11px] text-zinc-600">Prefilled — go back to edit</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proof-phone" className="text-zinc-300">Phone</Label>
          <Input
            id="proof-phone"
            value={phone}
            readOnly
            placeholder="Prefilled from your details"
            className="bg-[#0a0a0f] border-white/10 text-zinc-300 h-12 cursor-not-allowed font-mono"
          />
          <p className="text-[11px] text-zinc-600">Prefilled — go back to edit</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="txn-id" className="text-zinc-300">
            Transaction ID <span className="text-[#FFD700]">*</span>
          </Label>
          <Input
            id="txn-id"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value)}
            placeholder="e.g. TXN1234567890"
            className="bg-[#0a0a0f] border-white/10 text-white h-12 font-mono focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="proof-address" className="text-zinc-300">
            Address <span className="text-[#FFD700]">*</span>
          </Label>
          <textarea
            id="proof-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
            placeholder="Enter your street address, city, and region"
            className="w-full resize-none rounded-2xl bg-[#0a0a0f] border border-white/10 text-white px-4 py-3 text-sm focus-visible:border-[#FFD700] focus-visible:ring-[#FFD700]/20"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-zinc-300">
            Upload Screenshot <span className="text-[#FFD700]">*</span>
          </Label>
          <ScreenshotUpload screenshot={screenshot} onChange={onScreenshotChange} />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        className="w-full bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 hover:scale-[1.005] transition-all rounded-xl font-bold h-12 shadow-[0_8px_30px_rgba(255,215,0,0.35)] border-none"
      >
        <Upload className="w-4 h-4 mr-2" />
        Submit Payment
      </Button>
    </div>
  );
}

function ScreenshotUpload({
  screenshot,
  onChange,
}: {
  screenshot: { name: string; dataUrl: string } | null;
  onChange: (file: File | null) => void;
}) {
  if (screenshot) {
    return (
      <div className="rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 p-4 flex items-center gap-4">
        <img
          src={screenshot.dataUrl}
          alt="Payment screenshot preview"
          className="w-20 h-20 object-cover rounded-lg border border-white/10"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{screenshot.name}</p>
          <p className="text-xs text-emerald-400 mt-1 inline-flex items-center gap-1">
            <Check className="w-3 h-3" /> Ready to submit
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Remove screenshot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor="screenshot-upload"
      className="group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-[#0a0a0f] p-8 cursor-pointer hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5 transition-all"
    >
      <div className="w-12 h-12 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
        <ImageIcon className="w-5 h-5 text-[#FFD700]" />
      </div>
      <p className="text-sm text-white font-medium">Click to upload screenshot</p>
      <p className="text-xs text-zinc-500">PNG, JPG up to 5 MB</p>
      <input
        id="screenshot-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
