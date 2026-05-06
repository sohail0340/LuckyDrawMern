import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  CreditCard,
  ListChecks,
  Trophy,
  Sparkles,
  ShieldCheck,
  Eye,
  FileCheck2,
  Users,
  Hash,
  Lock,
  ArrowRight,
  Plus,
  HelpCircle,
  Wallet,
  Smartphone,
  Landmark,
  Upload,
  Hourglass,
  CheckCircle2,
  Trophy as TrophyIcon,
  Dice5,
  Zap,
  Coins,
  Megaphone,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { usePageContent } from "@/hooks/usePageContent";
import { SiteFooter } from "@/components/SiteFooter";

import goldTokenImg from "@/assets/gold-token.png";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      <Hero />
      <StepTimeline />
      <TokenExplanation />
      <PaymentProcess />
      <DrawSystem />
      <Transparency />
      <FaqSection />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.10] blur-[140px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* Floating decorative tokens */}
      {[
        { top: "20%", left: "8%", delay: 0, size: 60 },
        { top: "60%", left: "5%", delay: 1, size: 40 },
        { top: "30%", right: "10%", delay: 0.5, size: 50 },
        { top: "70%", right: "7%", delay: 1.5, size: 45 },
      ].map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, y: [0, -12, 0], rotate: [0, 8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: p.delay },
            scale: { duration: 0.6, delay: p.delay },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: p.delay },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: p.delay },
          }}
          className="absolute hidden md:block pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            width: p.size,
            height: p.size,
          }}
        >
          <img
            src={goldTokenImg}
            alt=""
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </motion.div>
      ))}

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              The Kaptan Process
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-heading font-bold leading-[1.05] tracking-tight text-white text-[40px] sm:text-[52px] lg:text-[64px] mb-5"
          >
            Simple Steps,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
              Big Wins
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Kaptan Lucky Draw makes winning exciting prizes simple. Follow the steps below
            to buy tokens, join draws, and win amazing prizes.
          </motion.p>

          {/* Stat row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {[
              { label: "Total Users", value: "50,000+", icon: Users },
              { label: "Tokens Sold", value: "1M+", icon: Ticket },
              { label: "Total Winners", value: "1,200+", icon: Trophy },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-primary/30 transition-colors"
              >
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-xl lg:text-2xl font-bold font-heading text-white">
                  {s.value}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5 font-semibold">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StepTimeline() {
  const { get: pg } = usePageContent("how-it-works");
  const steps = [
    {
      step: "01",
      title: pg("step1_title", "Buy Tokens"),
      desc: pg("step1_desc", "Choose your favorite draw and purchase tokens to participate. Each token gives you an entry into the lucky draw."),
      detail: pg("step1_detail", "Tokens are affordable and buying multiple tokens increases your winning chances."),
      icon: Ticket,
    },
    {
      step: "02",
      title: pg("step2_title", "Submit Payment"),
      desc: pg("step2_desc", "Complete your payment using supported methods and upload your payment proof for verification."),
      detail: pg("step2_detail", "Payments are verified by the admin team and tokens are added once approved."),
      icon: CreditCard,
    },
    {
      step: "03",
      title: pg("step3_title", "Receive Your Entries"),
      desc: pg("step3_desc", "Once your payment is verified, your tokens are converted into entries with a unique ID for the selected draw."),
      detail: pg("step3_detail", "Every entry receives an equal chance of winning — no preferences, no insiders."),
      icon: ListChecks,
    },
    {
      step: "04",
      title: pg("step4_title", "Win the Prize"),
      desc: pg("step4_desc", "When the draw closes, our secure system randomly selects a winning entry. Winners are announced publicly."),
      detail: pg("step4_detail", "Prizes are delivered fast — cash within hours, physical prizes within days."),
      icon: TrophyIcon,
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-zinc-950/50 relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-primary/[0.05] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-yellow-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Your Journey
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-4">
            Four Steps to <span className="text-primary">Winning</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From your first token to your prize handover — here's everything that happens.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 relative">
          {/* Animated connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-[2px] z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <motion.div
              animate={{ x: ["-30%", "130%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(255,215,0,0.8)]"
            />
          </div>

          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative z-10"
            >
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group h-full bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 text-center hover:border-primary/50 hover:shadow-[0_20px_60px_-15px_rgba(255,215,0,0.2)] transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-2 right-4 text-6xl font-black font-heading text-white/[0.04] select-none pointer-events-none leading-none">
                  {s.step}
                </div>

                <div className="relative mx-auto w-fit mb-6">
                  <div className="absolute inset-0 bg-primary/30 blur-xl rounded-3xl group-hover:bg-primary/50 transition-colors duration-300" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a1a22] to-[#0d0d12] border border-primary/30 flex items-center justify-center group-hover:border-primary/70 group-hover:scale-110 transition-all duration-300">
                    <s.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#FFE066] to-[#FFB800] flex items-center justify-center text-[10px] font-black text-black shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
                    {s.step}
                  </div>
                </div>

                <h3 className="text-lg font-bold font-heading mb-2.5 group-hover:text-primary transition-colors min-h-[56px] flex items-center justify-center">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 min-h-[124px]">
                  {s.desc}
                </p>
                <div className="mt-auto text-[11px] text-primary/80 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 min-h-[54px] flex items-center justify-center">
                  {s.detail}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TokenExplanation() {
  const points = [
    "Each token equals one draw entry",
    "Buying multiple tokens increases your chances",
    "Tokens are linked to your verified account",
    "Each token gets a unique traceable ID",
  ];

  return (
    <section className="py-20 lg:py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Token Explained
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-heading mb-5 leading-tight">
              What is a <span className="text-primary">Token</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              A token is your entry into a lucky draw. Each token represents one
              chance to win — the more tokens you hold, the higher your odds.
            </p>

            <ul className="space-y-3">
              {points.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 bg-card/50 border border-white/10 rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-zinc-200 font-medium pt-0.5">{p}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right: visual flow card */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-card to-zinc-950 border border-primary/25 rounded-3xl p-8 shadow-[0_20px_60px_-20px_rgba(255,215,0,0.2)]">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative space-y-4">
                {[
                  { label: "Buy a token", icon: Ticket, sub: "Rs. 100 / token" },
                  { label: "Becomes 1 entry", icon: Hash, sub: "Unique ID assigned" },
                  { label: "Joins the draw", icon: Dice5, sub: "Equal odds for all" },
                ].map((item, i) => (
                  <div key={i}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12 }}
                      className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFE066] to-[#FFB800] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,215,0,0.35)]">
                        <item.icon className="w-6 h-6 text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{item.label}</div>
                        <div className="text-xs text-zinc-500">{item.sub}</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {i + 1}
                      </div>
                    </motion.div>
                    {i < 2 && (
                      <div className="flex justify-center py-1.5">
                        <ArrowRight className="w-5 h-5 text-primary/50 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentProcess() {
  const cards = [
    {
      step: "01",
      title: "Make Payment",
      desc: "Send your payment using any supported method — bank transfer, Easypaisa, JazzCash or SadaPay.",
      icon: Wallet,
      methods: [
        { icon: Landmark, label: "Bank" },
        { icon: Smartphone, label: "Mobile" },
      ],
    },
    {
      step: "02",
      title: "Upload Proof",
      desc: "Upload your payment screenshot or transaction ID directly through your dashboard.",
      icon: Upload,
      methods: [
        { icon: FileCheck2, label: "Screenshot" },
        { icon: Hash, label: "Txn ID" },
      ],
    },
    {
      step: "03",
      title: "Admin Verification",
      desc: "Our admin team verifies your payment and credits the tokens to your account immediately.",
      icon: ShieldCheck,
      methods: [
        { icon: Hourglass, label: "<1 hr" },
        { icon: CheckCircle2, label: "Approved" },
      ],
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-zinc-950/50 relative overflow-hidden border-y border-white/5">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Payment Flow
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-4">
            Pay & Get Verified <span className="text-primary">Fast</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From submitting payment to receiving entries — usually under an hour.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-7 hover:border-primary/40 hover:shadow-[0_20px_60px_-15px_rgba(255,215,0,0.18)] transition-all relative overflow-hidden"
            >
              <div className="absolute top-3 right-5 text-6xl font-black font-heading text-white/[0.04] select-none pointer-events-none leading-none">
                {c.step}
              </div>

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1a22] to-[#0d0d12] border border-primary/30 flex items-center justify-center mb-5 group-hover:border-primary/60 transition-colors">
                  <c.icon className="w-7 h-7 text-primary" />
                </div>

                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80 mb-2">
                  Step {c.step}
                </div>
                <h3 className="text-xl font-bold font-heading text-white mb-3">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {c.desc}
                </p>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                  {c.methods.map((m, mi) => (
                    <div
                      key={mi}
                      className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-300"
                    >
                      <m.icon className="w-3 h-3 text-primary" />
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 max-w-3xl mx-auto bg-card/50 border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Verification Progress
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              ~ 30 min average
            </span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-primary to-yellow-300 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.5)]"
            />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-zinc-500 font-medium">
            <span>Submitted</span>
            <span>Reviewing</span>
            <span>Verified</span>
            <span>Tokens Live</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DrawSystem() {
  const flow = [
    {
      title: "Draw Reaches Capacity",
      desc: "When the maximum tokens are sold or the draw end time arrives.",
      icon: Hourglass,
    },
    {
      title: "Entries Are Locked",
      desc: "All entries are frozen and snapshotted on a public ledger.",
      icon: Lock,
    },
    {
      title: "Random Selection",
      desc: "Provably-fair algorithm selects one winning entry — equal odds for everyone.",
      icon: Dice5,
    },
    {
      title: "Winner Announced",
      desc: "The winner is announced publicly and the prize is delivered.",
      icon: Megaphone,
    },
  ];

  return (
    <section className="py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/[0.06] blur-[140px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <Dice5 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Draw Mechanics
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-4">
            How Winners Are <span className="text-primary">Picked</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Every entry has an exactly equal probability — no exceptions, no preferences.
          </p>
        </div>

        {/* Animated draw machine + flow */}
        <div className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          {/* Visual: animated draw drum */}
          <div className="relative flex items-center justify-center min-h-[360px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 m-auto w-72 h-72 rounded-full border-2 border-dashed border-primary/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 m-auto w-56 h-56 rounded-full border border-dotted border-primary/40"
            />
            <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent border-2 border-primary/50 shadow-[0_0_60px_rgba(255,215,0,0.4)] flex items-center justify-center">
              <Dice5 className="w-16 h-16 text-primary drop-shadow-[0_0_12px_rgba(255,215,0,0.7)]" />
            </div>

            {/* Floating entry chips */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              const r = 150;
              return (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute"
                  style={{
                    transform: `translate(${Math.cos(angle) * r}px, ${
                      Math.sin(angle) * r
                    }px)`,
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFE066] to-[#FFB800] flex items-center justify-center shadow-[0_4px_12px_rgba(255,215,0,0.4)] text-[10px] font-black text-black">
                    #{1234 + i}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Flow list */}
          <div className="space-y-4">
            {flow.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 bg-card border border-white/10 rounded-2xl p-5 hover:border-primary/30 transition-colors"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-primary text-base">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <f.icon className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-white">{f.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Transparency() {
  const features = [
    {
      icon: BadgeIcon,
      title: "Verified Winners",
      desc: "Every winner is publicly listed with a verification badge.",
    },
    {
      icon: PlayCircle,
      title: "Draw Recordings",
      desc: "Each draw is recorded and the video is published for review.",
    },
    {
      icon: Hash,
      title: "Unique Entry IDs",
      desc: "Every token generates a traceable ID — auditable any time.",
    },
    {
      icon: Eye,
      title: "Public Results",
      desc: "Results are visible to all users in real time, not behind a wall.",
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-zinc-950/50 relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/[0.05] rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              100% Transparent
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-4">
            Trust, <span className="text-primary">Provably</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We've built every layer of the platform to be visible, verifiable, and auditable.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-2xl p-6 hover:border-primary/40 hover:shadow-[0_15px_40px_-15px_rgba(255,215,0,0.18)] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { get: pg } = usePageContent("how-it-works");
  const items = [
    {
      q: pg("faq1_q", "Is Kaptan Lucky Draw real?"),
      a: pg("faq1_a", "Yes — we are a registered Pakistani entity with a public office, verified winners, and recorded draws. Every payout is documented and visible on our winners page."),
    },
    {
      q: pg("faq2_q", "How are winners selected?"),
      a: pg("faq2_a", "Winners are selected by a provably-fair random algorithm that uses a hidden server seed combined with a public client seed. The result cannot be predicted or manipulated by anyone."),
    },
    {
      q: pg("faq3_q", "How many tokens can I buy?"),
      a: pg("faq3_a", "There is no per-user limit on tokens. You can buy as many tokens as you want for any active draw, up to the total token supply for that draw."),
    },
    {
      q: pg("faq4_q", "Can I join multiple draws?"),
      a: pg("faq4_a", "Absolutely. You can hold tokens across as many active draws as you like. Each draw is independent and your odds in each are calculated separately."),
    },
    {
      q: pg("faq5_q", "How will I receive my prize?"),
      a: pg("faq5_a", "Cash prizes are sent to your wallet (Easypaisa, JazzCash, SadaPay or bank) within hours of the draw. Physical prizes are handed over in our regional offices or delivered to your address securely."),
    },
    {
      q: pg("faq6_q", "What happens if a draw does not fill?"),
      a: pg("faq6_a", "If a draw does not reach 100% sold within 90 days, all participants are refunded the full token amount to their wallet — no fees, no questions."),
    },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Common Doubts
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Quick answers to the questions we hear most often.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((faq, i) => {
            const isOpen = open === i;
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
                    : "from-card to-zinc-950 border-white/10 hover:border-primary/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? "bg-gradient-to-br from-[#FFE066] to-[#FFB800] text-black shadow-[0_4px_12px_rgba(255,215,0,0.35)]"
                          : "bg-white/5 text-zinc-400 border border-white/10 group-hover:text-primary group-hover:border-primary/30"
                      }`}
                    >
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-bold text-base leading-tight transition-colors ${
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
                        : "bg-white/5 border border-white/10 group-hover:border-primary/40"
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
                      <div className="px-5 pb-5 pl-[72px] text-muted-foreground leading-relaxed text-sm">
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

function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/[0.10] blur-[140px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-br from-card to-zinc-900 border border-primary/30 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden"
        >
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFE066] to-[#FFB800] items-center justify-center mb-5 shadow-[0_8px_24px_rgba(255,215,0,0.4)]">
              <Trophy className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold font-heading text-white mb-4">
              Ready to <span className="text-primary">Try Your Luck?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of participants already winning exciting prizes on Kaptan Lucky Draw.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/draws">
                <Button
                  size="lg"
                  className="bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 transition-all rounded-xl font-bold text-base px-8 h-13 group shadow-[0_8px_24px_rgba(255,215,0,0.35)] border-none w-full sm:w-auto"
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  Join Live Draw
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/#prizes">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl font-bold border-2 border-white/15 text-white hover:bg-white/5 hover:border-primary/40 px-8 h-13 w-full sm:w-auto"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Active Draws
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 mt-6">
              <ShieldCheck className="w-4 h-4 text-primary" />
              100% transparent draw system
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
