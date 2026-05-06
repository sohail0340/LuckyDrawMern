import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Eye,
  Coins,
  Gift,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  Lock,
  Heart,
  TrendingUp,
  ArrowRight,
  Hash,
  Megaphone,
  Scale,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { usePageContent } from "@/hooks/usePageContent";
import { SiteFooter } from "@/components/SiteFooter";
import ownersImage from "../assets/luckydraw-owners.webp";

export default function About() {
  const { get: pg } = usePageContent("about");
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <Hero pg={pg} />
      <OwnersSection />
      <MissionVision pg={pg} />
      <WhatIs />
      <Community pg={pg} />
      <FinalCTA pg={pg} />
      <SiteFooter />
    </div>
  );
}

type Pg = (key: string, fallback?: string) => string;

function Hero({ pg }: { pg: Pg }) {
  const badges = [
    { icon: ScrollText, label: "Transparent Draw System" },
    { icon: Award, label: "Verified Winners" },
    { icon: Lock, label: "Secure Payments" },
  ];

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/[0.10] blur-[140px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)`, backgroundSize: "56px 56px" }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Our Story</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-heading font-bold leading-[1.05] tracking-tight text-white text-[40px] sm:text-[54px] lg:text-[64px] mb-5">
            About <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">Kaptan Lucky Draw</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-zinc-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-5 font-medium">
            {pg("hero_subtitle", "Creating a transparent and exciting way for people to win amazing prizes.")}
          </motion.p>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-zinc-400 text-sm lg:text-base max-w-2xl mx-auto leading-relaxed mb-9">
            {pg("hero_body", "Kaptan Lucky Draw is a modern digital lucky draw platform designed to give everyone a fair chance to win big prizes. With our secure token system and transparent draw process, users can participate confidently and enjoy the thrill of winning.")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-3">
            {badges.map((b, i) => (
              <div key={i} className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 hover:border-primary/30 transition-colors">
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

function OwnersSection() {
  return (
    <section className="py-16 lg:py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Owners</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold font-heading text-white leading-tight">
              Meet the <span className="text-primary">People Behind</span> Kaptan Lucky Draw
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
              Our owners are the driving force behind the platform, ensuring every draw stays fair, secure, and transparent for everyone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-[2rem]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <img
                src={ownersImage}
                alt="Owners of Kaptan Lucky Draw"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MissionVision({ pg }: { pg: Pg }) {
  const blocks = [
    { eyebrow: "Our Mission", icon: Target, title: pg("mission_title", "Fair chances for everyone, big or small."), body: pg("mission_body", "Our mission is to create a fair, transparent, and exciting platform where anyone can participate in lucky draws and win valuable prizes without needing a large investment. We believe everyone deserves a chance to win big."), align: "left" as const },
    { eyebrow: "Our Vision", icon: Eye, title: pg("vision_title", "The most trusted draw platform in Pakistan."), body: pg("vision_body", "Our vision is to become one of the most trusted digital lucky draw platforms by building a transparent system that users can rely on. We aim to create a community where fairness, excitement, and trust come together."), align: "right" as const },
  ];

  return (
    <section className="py-16 lg:py-20 bg-zinc-950/50 border-y border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          {blocks.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${b.align === "right" ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 mb-4"><span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">{b.eyebrow}</span></div>
                <h2 className="text-3xl lg:text-4xl font-bold font-heading text-white mb-5 leading-tight">{b.title}</h2>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">{b.body}</p>
              </div>
              <div className="relative h-72 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/[0.06] rounded-[40px] blur-2xl" />
                <div className="relative w-56 h-56 rounded-[40px] bg-gradient-to-br from-card to-zinc-950 border border-primary/20 flex items-center justify-center shadow-[0_20px_60px_-20px_rgba(255,215,0,0.25)]">
                  <div className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFE066] to-[#FFB800] flex items-center justify-center shadow-[0_8px_20px_rgba(255,215,0,0.4)]"><Sparkles className="w-7 h-7 text-black" strokeWidth={2.2} /></div>
                  <b.icon className="w-24 h-24 text-primary drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]" strokeWidth={1.4} />
                  <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 rounded-[40px] border-2 border-primary/30" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatIs() {
  const icons = [
    { icon: Coins, label: "Tokens", desc: "Buy tokens to enter draws" },
    { icon: Trophy, label: "Lucky Draw", desc: "Live, fair random selection" },
    { icon: Gift, label: "Prizes", desc: "Cars, bikes, cash & more" },
  ];

  return (
    <section className="py-16 lg:py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"><Megaphone className="w-3.5 h-3.5 text-primary" /><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">The Concept</span></div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-5">What is <span className="text-primary">Kaptan Lucky Draw?</span></h2>
          <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">Kaptan Lucky Draw is an online platform where users purchase tokens to participate in lucky draws for exciting prizes such as cars, bikes, and cash rewards. Each token gives the user a chance to win, and winners are selected using a fair and transparent draw system.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {icons.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 text-center hover:border-primary/40 transition-all">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 flex items-center justify-center mb-4"><c.icon className="w-7 h-7 text-primary" /></div>
              <div className="font-bold font-heading text-white text-lg mb-1">{c.label}</div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Community({ pg }: { pg: Pg }) {
  return (
    <section className="py-16 lg:py-20 bg-zinc-950/50 border-y border-white/5 relative">
      <div className="container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"><Users className="w-3.5 h-3.5 text-primary" /><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Community</span></div>
        <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">{pg("community_title", "A Community Built on Trust & Excitement")}</h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{pg("community_body", "Our platform continues to grow as more users join our community every day. We are committed to improving our platform, adding new prize categories, and providing exciting opportunities for everyone.")}</p>
      </div>
    </section>
  );
}

function FinalCTA({ pg }: { pg: Pg }) {
  return (
    <section className="py-16 lg:py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto rounded-[32px] border border-primary/20 bg-gradient-to-br from-card to-zinc-950 p-8 lg:p-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"><Heart className="w-3.5 h-3.5 text-primary" /><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Our Promise</span></div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">{pg("cta_title", "Ready to Try Your Luck?")}</h2>
          <p className="text-muted-foreground text-lg mb-8">{pg("cta_subtitle", "Join thousands of users already participating in our lucky draws.")}</p>
          <Link href="/draws"><Button className="bg-primary text-black hover:bg-yellow-400 font-bold rounded-xl px-8 h-12">Join Live Draw <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
      </div>
    </section>
  );
}
