import { useState, useRef, FormEvent } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  Plus,
  HelpCircle,
  Send,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Headphones,
  Zap,
  User,
  AtSign,
  FileText,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { usePageContent } from "@/hooks/usePageContent";
import { contactApi } from "@/lib/api";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <SupportForm />
      <ContactInfo />
      <FAQSection />
      <SiteFooter />
    </div>
  );
}

/* ============================ HERO ============================ */

function Hero() {
  const badges = [
    { icon: Zap, label: "Fast Response" },
    { icon: Headphones, label: "Real Human Support" },
    { icon: ShieldCheck, label: "Secure & Confidential" },
  ];

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/[0.10] blur-[140px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* Floating particles */}
      {[
        { top: "20%", left: "10%", delay: 0 },
        { top: "60%", left: "8%", delay: 1 },
        { top: "25%", right: "12%", delay: 0.5 },
        { top: "70%", right: "10%", delay: 1.5 },
      ].map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3.5, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          className="absolute hidden md:block pointer-events-none"
          style={{ top: p.top, left: p.left, right: p.right }}
        >
          <Sparkles className="w-4 h-4 text-primary drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
        </motion.div>
      ))}

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6"
          >
            <Headphones className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              Support Center
            </span>
          </motion.div>

          {/* Support icon illustration */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative inline-flex items-center justify-center mb-8"
          >
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FFE066] to-[#FFB800] flex items-center justify-center shadow-[0_12px_40px_rgba(255,215,0,0.45)]">
              <Headphones className="w-12 h-12 text-black" strokeWidth={2.2} />
            </div>
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl border-2 border-primary"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-heading font-bold leading-[1.05] tracking-tight text-white text-[40px] sm:text-[54px] lg:text-[64px] mb-5"
          >
            Need Help?{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
              We're Here for You.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-9"
          >
            Our support team is ready to assist you with payments, tokens, draws, and account questions.
          </motion.p>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {badges.map((b, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 hover:border-primary/30 transition-colors"
              >
                <b.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-zinc-200">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}


/* ============================ SUPPORT FORM ============================ */

function SupportForm() {
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await contactApi.submit({
        name: nameRef.current!.value,
        email: emailRef.current!.value,
        phone: phoneRef.current!.value,
        subject: subjectRef.current!.value,
        message: messageRef.current!.value,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="form" className="py-16 lg:py-20 relative overflow-hidden bg-zinc-950/50 border-y border-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-gradient-to-br from-card to-zinc-950 border border-emerald-500/30 rounded-3xl p-10 lg:p-14 text-center shadow-[0_20px_60px_-20px_rgba(16,185,129,0.3)]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={2.5} />
            </motion.div>
            <h3 className="text-2xl lg:text-3xl font-bold font-heading text-white mb-3">
              Request Received
            </h3>
            <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
              Your support request has been received. Our team will respond soon — usually within a few hours.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setFileName(null);
              }}
              variant="outline"
              className="rounded-xl border-white/15 hover:border-primary/40 text-white font-bold px-6 h-11"
            >
              Submit Another Request
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="form" className="py-16 lg:py-20 relative overflow-hidden bg-zinc-950/50 border-y border-white/5">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Support Ticket
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">
            Submit a <span className="text-primary">Support Request</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tell us what's going on. We respond to every request within hours.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={onSubmit}
          className="max-w-3xl mx-auto bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 lg:p-9 shadow-[0_15px_50px_-20px_rgba(255,215,0,0.15)]"
        >
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <FieldLabel label="Full Name" required>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  ref={nameRef}
                  required
                  placeholder="Ahmad Khan"
                  className="pl-10 h-11 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50"
                />
              </div>
            </FieldLabel>

            <FieldLabel label="Email Address" required>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  ref={emailRef}
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50"
                />
              </div>
            </FieldLabel>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <FieldLabel label="Phone Number" required>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  ref={phoneRef}
                  required
                  type="tel"
                  placeholder="+92 300 1234567"
                  className="pl-10 h-11 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50"
                />
              </div>
            </FieldLabel>

            <FieldLabel label="Subject" required>
              <div className="relative">
                <select
                  ref={subjectRef}
                  required
                  defaultValue=""
                  className="w-full h-11 appearance-none bg-black/40 border border-white/10 text-white rounded-xl pl-3.5 pr-10 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:outline-none"
                >
                  <option value="" disabled>
                    Select a topic...
                  </option>
                  <option value="payment">Payment Issue</option>
                  <option value="token">Token Not Received</option>
                  <option value="draw">Draw Question</option>
                  <option value="referral">Referral Problem</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </FieldLabel>
          </div>

          <FieldLabel label="Message" required className="mb-5">
            <textarea
              ref={messageRef}
              required
              rows={5}
              placeholder="Describe your issue in as much detail as possible..."
              className="w-full bg-black/40 border border-white/10 text-white placeholder:text-zinc-500 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/50 focus:outline-none resize-none"
            />
          </FieldLabel>

          <FieldLabel label="Upload Screenshot (optional)" className="mb-7">
            <label
              htmlFor="contact-file"
              className="block cursor-pointer bg-black/40 border-2 border-dashed border-white/15 hover:border-primary/40 rounded-xl p-6 text-center transition-colors group"
            >
              <input
                id="contact-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{fileName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFileName(null);
                    }}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400"
                    aria-label="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-zinc-500 group-hover:text-primary mx-auto mb-2 transition-colors" />
                  <div className="text-sm text-zinc-300 font-bold mb-0.5">
                    Click to upload screenshot
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    PNG, JPG up to 5MB — useful for payment proof
                  </div>
                </>
              )}
            </label>
          </FieldLabel>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="w-full bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 transition-all rounded-xl font-bold text-base h-13 group shadow-[0_8px_24px_rgba(255,215,0,0.35)] border-none disabled:opacity-60"
          >
            <Send className="w-5 h-5 mr-2" />
            {submitting ? "Submitting…" : "Submit Support Request"}
            {!submitting && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>

          <p className="text-center text-[11px] text-zinc-500 mt-4">
            By submitting, you agree to our Privacy Policy. We never share your data.
          </p>
        </motion.form>
      </div>
    </section>
  );
}

function FieldLabel({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ============================ CONTACT INFO ============================ */

function ContactInfo() {
  const { get: pg } = usePageContent("contact");
  const supportEmail = pg("support_email", "support@captainluckydraw.com");
  const items = [
    {
      icon: Mail,
      title: "Email Support",
      value: supportEmail,
      note: "Replies within 24 hours",
      color: "sky",
      href: `mailto:${supportEmail}`,
    },
    {
      icon: Clock,
      title: "Support Hours",
      value: "Mon – Sun",
      note: "10:00 AM – 10:00 PM",
      color: "gold",
    },
    {
      icon: HelpCircle,
      title: "Quick Guides",
      value: "Instant Help Center",
      note: "Tap to open support tips",
      color: "emerald",
    },
  ];

  return (
    <section className="py-16 lg:py-20 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Reach Us
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">
            Contact <span className="text-primary">Information</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Multiple ways to get in touch — pick whatever works best.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const colorMap = {
              emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              sky: "bg-sky-500/10 border-sky-500/30 text-sky-400",
              gold: "bg-primary/10 border-primary/30 text-primary",
            }[item.color as "emerald" | "sky" | "gold"];

            const Wrapper: React.ElementType = item.href ? "a" : "div";
            const wrapperProps = item.href
              ? {
                  href: item.href,
                  target: item.href.startsWith("http") ? "_blank" : undefined,
                  rel: item.href.startsWith("http") ? "noopener noreferrer" : undefined,
                }
              : {};

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
              >
                <Wrapper
                  {...wrapperProps}
                  className="block bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 lg:p-7 hover:border-primary/40 hover:shadow-[0_15px_40px_-15px_rgba(255,215,0,0.18)] transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${colorMap}`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    {item.title}
                  </div>
                  <div className="font-bold text-white text-lg mb-1.5 break-all">
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.note}</div>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */

const FAQS = [
  {
    q: "Is Kaptan Lucky Draw real or safe?",
    a: "Yes — Kaptan Lucky Draw is a fully transparent platform. Every draw is recorded live, every winner is publicly announced, and all token IDs are unique and verifiable on the Winners page.",
  },
  {
    q: "How long does payment verification take?",
    a: "Most payments are verified within 5–15 minutes during support hours. After uploading proof, you'll receive a confirmation on WhatsApp once your tokens are added to your account.",
  },
  {
    q: "What if I don't receive my tokens?",
    a: "If your tokens haven't appeared within 30 minutes of payment, contact us on WhatsApp with your transaction ID and screenshot. Our team will resolve it immediately — no token is ever lost.",
  },
  {
    q: "How are winners selected?",
    a: "Winners are selected randomly using a provably-fair algorithm. Every token has an equal chance of winning. Draws are conducted live and recorded for full transparency.",
  },
  {
    q: "Can I request a refund?",
    a: "Tokens purchased for active draws are non-refundable once confirmed. However, if there's an error on our side (duplicate charge, payment issue), reach out to support and we'll resolve it.",
  },
  {
    q: "How will I receive my prize?",
    a: "Cash prizes are transferred via Easypaisa, JazzCash, or bank transfer within 48 hours. Physical prizes (cars, bikes, electronics) are delivered to your city with a recorded handover ceremony.",
  },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 lg:py-20 bg-zinc-950/50 border-y border-white/5 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Common Questions
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Quick answers to the most common support questions.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`group bg-gradient-to-br rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "from-card to-zinc-900 border-primary/40 shadow-[0_8px_30px_-10px_rgba(255,215,0,0.2)]"
                    : "from-card to-zinc-950 border-white/10 hover:border-primary/30 hover:bg-white/[0.02]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 lg:p-6 text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isOpen
                          ? "bg-gradient-to-br from-[#FFE066] to-[#FFB800] text-black shadow-[0_4px_12px_rgba(255,215,0,0.35)]"
                          : "bg-white/5 text-zinc-400 border border-white/10 group-hover:text-primary group-hover:border-primary/30"
                      }`}
                    >
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-bold text-base lg:text-lg leading-tight transition-colors duration-300 ${
                        isOpen ? "text-white" : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <div
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? "bg-primary/15 border border-primary/40 rotate-45"
                        : "bg-white/5 border border-white/10 group-hover:border-primary/40 group-hover:text-primary"
                    }`}
                  >
                    <Plus
                      className={`w-4 h-4 ${isOpen ? "text-primary" : "text-zinc-400"}`}
                      strokeWidth={2.5}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 lg:px-6 pb-6 pl-[72px] lg:pl-[78px] text-muted-foreground leading-relaxed">
                        <div className="border-l-2 border-primary/30 pl-4">{faq.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

