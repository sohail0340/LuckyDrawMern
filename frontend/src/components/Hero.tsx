import { useState, useEffect } from "react";
import { Flame, Ticket, PlayCircle, Shield, Trophy, Lock, ArrowRight, DollarSign, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LiveActivity } from "./LiveActivity";
import { usePageContent } from "@/hooks/usePageContent";

import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";

import luxuryCarImg from "@/assets/luxury-car-white-nobg.png";
import sportBikeImg from "@/assets/sport-bike-nobg.png";
import cashStacksImg from "@/assets/cash-stacks-nobg.png";

function useLiveCount(start = 2341) {
  const [count, setCount] = useState(start);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const delta = Math.floor(Math.random() * 3) + 1;
      setCount((c) => c + delta);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return { count, flash };
}

export function Hero() {
  const { count, flash } = useLiveCount(2341);
  const { get: pg } = usePageContent("home");
  return (
    <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-[#0a0a0f]">
      {/* Background Vignette & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(255,215,0,0.10)_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,215,0,0.05)_0%,transparent_40%)]" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-6 items-center">

          {/* Left Column: Content */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-7">

            {/* User count pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 bg-[#111118] border border-[#FFD700]/30 rounded-full p-1.5 pr-5 w-max shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
            >
              <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="flex -space-x-2 shrink-0">
                <img src={avatar1} alt="User" className="w-7 h-7 rounded-full border-2 border-[#111118] object-cover" />
                <img src={avatar2} alt="User" className="w-7 h-7 rounded-full border-2 border-[#111118] object-cover" />
                <img src={avatar3} alt="User" className="w-7 h-7 rounded-full border-2 border-[#111118] object-cover" />
              </div>
              <span className="text-sm text-white font-medium">
                <span
                  className={`font-bold text-[#FFD700] transition-all duration-300 ${flash ? "scale-110 brightness-125" : ""}`}
                  style={{ display: "inline-block" }}
                >
                  {count.toLocaleString()}
                </span>{" "}users joined today
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading font-bold leading-[1.05] tracking-tight text-white text-[44px] sm:text-[52px] lg:text-[54px] xl:text-[64px]"
            >
              Win{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
                Cars
              </span>
              ,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
                Bikes
              </span>{" "}
              &{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
                Cash
              </span>{" "}
              with Just{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
                Rs. 100
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#A1A1AA] text-base lg:text-lg max-w-xl leading-relaxed"
            >
              {pg("hero_subheadline", "Buy tokens, join lucky draws, and win big — 100% transparent system with verified winners.")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-1"
            >
              <Link href="/buy-tokens">
                <Button
                  size="lg"
                  className="bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 hover:scale-[1.02] transition-all rounded-xl font-bold text-base px-7 h-14 group shadow-[0_8px_30px_rgba(255,215,0,0.35)] border-none w-full sm:w-auto"
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  Join Live Draw
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl font-semibold text-base px-7 h-14 border-2 border-[#FFD700]/70 text-[#FFD700] hover:bg-[#FFD700]/10 hover:border-[#FFD700] bg-transparent w-full sm:w-auto"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  How It Works
                </Button>
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-start gap-x-8 gap-y-5 pt-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#FFD700]/60 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm leading-tight">{pg("trust1_title", "Verified Winners")}</span>
                  <span className="text-zinc-500 text-xs mt-0.5">{pg("trust1_sub", "Real people, Real wins")}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#FFD700]/60 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm leading-tight">{pg("trust2_title", "Transparent System")}</span>
                  <span className="text-zinc-500 text-xs mt-0.5">{pg("trust2_sub", "Fair & Random Draws")}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#FFD700]/60 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm leading-tight">{pg("trust3_title", "Secure Payments")}</span>
                  <span className="text-zinc-500 text-xs mt-0.5">{pg("trust3_sub", "Your safety is our priority")}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Prize Showcase & Live Activity */}
          <div className="lg:col-span-6 xl:col-span-7 relative h-[520px] lg:h-[600px] flex items-center justify-center">

            {/* Live Activity positioned top-right */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute top-0 right-0 z-50 hidden md:block"
            >
              <LiveActivity />
            </motion.div>

            {/* Prize Stage — centered, slightly left to give activity panel room */}
            <div className="absolute inset-0 flex items-end md:items-center justify-center md:justify-start lg:justify-center pb-4 lg:pb-0 lg:pl-0 xl:pl-8">
              <div className="relative w-[440px] h-[440px] sm:w-[520px] sm:h-[520px]">

                {/* Outer dashed rotating ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-[#FFD700]/25"
                />
                {/* Inner dotted counter-rotating ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-6 rounded-full border border-dotted border-[#FFD700]/30"
                />

                {/* Main glowing ring stage */}
                <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.18)_0%,transparent_65%)] shadow-[0_0_100px_rgba(255,215,0,0.45),inset_0_0_60px_rgba(255,215,0,0.35)] border border-[#FFD700]/60" />

                {/* Sparkle bursts (radial light rays) */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.15 }}
                    className="absolute top-1/2 left-1/2 w-px h-32 bg-gradient-to-t from-[#FFD700]/60 to-transparent origin-bottom"
                    style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg)`, transformOrigin: "bottom center" }}
                  />
                ))}

                {/* Soft gold glow under composition */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-12 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.35)_0%,rgba(255,215,0,0.12)_45%,transparent_75%)] blur-md z-10" />

                {/* Car (center back) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[88%] z-20"
                >
                  <img src={luxuryCarImg} alt="Toyota Corolla" className="w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
                </motion.div>

                {/* Cash (center front) */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[42%] z-30"
                >
                  <img src={cashStacksImg} alt="Cash Stacks" className="w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]" />
                </motion.div>

                {/* Bike (right forward) */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="absolute bottom-10 -right-2 w-[55%] z-40"
                >
                  <img src={sportBikeImg} alt="Honda Bike" className="w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]" />
                </motion.div>

                {/* Floating Bills - top left of ring */}
                <motion.div
                  animate={{ y: [-8, 8, -8], rotate: [-12, -18, -12] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 left-8 z-40 bg-gradient-to-br from-[#FFE066] to-[#FFB800] text-black p-2.5 rounded-lg shadow-[0_8px_20px_rgba(255,215,0,0.4)] flex items-center justify-center"
                >
                  <Star className="w-4 h-4 fill-black" />
                  <DollarSign className="w-5 h-5 ml-1" />
                </motion.div>

                {/* Floating Bills - top center-right of ring (avoid live activity) */}
                <motion.div
                  animate={{ y: [8, -8, 8], rotate: [12, 18, 12] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute top-8 right-[28%] z-40 bg-gradient-to-br from-[#FFE066] to-[#FFB800] text-black p-2.5 rounded-lg shadow-[0_8px_20px_rgba(255,215,0,0.4)] flex items-center justify-center"
                >
                  <Star className="w-4 h-4 fill-black" />
                  <DollarSign className="w-5 h-5 ml-1" />
                </motion.div>
              </div>
            </div>

            {/* Mobile Live Activity (stacked below) */}
            <div className="md:hidden absolute -bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
              <LiveActivity />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
