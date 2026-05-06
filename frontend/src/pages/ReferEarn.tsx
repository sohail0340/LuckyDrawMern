import { Link } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";
import { motion } from "framer-motion";
import {
  Gift,
  Users,
  Ticket,
  Trophy,
  ChevronLeft,
  ArrowRight,
  Share2,
  UserPlus,
  Sparkles,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { usePageContent } from "@/hooks/usePageContent";

const EXAMPLE_ROWS = [
  { friends: 1, tokens: 1 },
  { friends: 3, tokens: 3 },
  { friends: 5, tokens: 5 },
  { friends: 10, tokens: 10 },
];

export default function ReferEarn() {
  const { get: pg } = usePageContent("refer-earn");

  const STEPS = [
    {
      step: 1,
      icon: Share2,
      title: pg("step1_title", "Share Your Referral"),
      desc: pg("step1_desc", "Log in to your dashboard to get your unique referral code or link. Share it with friends and family on WhatsApp, SMS, or any platform."),
      color: "text-primary",
      bg: "bg-primary/10 border-primary/30",
    },
    {
      step: 2,
      icon: UserPlus,
      title: pg("step2_title", "Friend Signs Up"),
      desc: pg("step2_desc", "Your friend creates an account on Kaptan Lucky Draw using your referral code during registration."),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    {
      step: 3,
      icon: Ticket,
      title: pg("step3_title", "1 Token for Eligible Referrers"),
      desc: pg("step3_desc", "Only users who have purchased 100 or more tokens can create a referral link. When someone signs up through that link, the referrer gets 1 free token and the new user does not receive a referral token."),
      color: "text-yellow-300",
      bg: "bg-yellow-500/10 border-yellow-500/30",
    },
  ];

  const REWARDS = [
    { icon: Ticket, label: pg("reward1_label", "100+ Tokens"), sub: pg("reward1_sub", "required to unlock referrals"), color: "text-primary" },
    { icon: Gift, label: pg("reward2_label", "1 Free Token"), sub: pg("reward2_sub", "earned by the referrer only"), color: "text-emerald-400" },
    { icon: Trophy, label: pg("reward3_label", "Link Available"), sub: pg("reward3_sub", "only in eligible accounts"), color: "text-yellow-300" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 sm:pt-32 pb-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-yellow-500/8 rounded-full blur-[100px]" />
        </div>
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,215,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.5) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-primary text-sm mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6"
            >
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Refer & Earn Program</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-5 leading-tight"
            >
              Invite Friends &{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">
                Earn Rewards
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8"
            >
              Users who buy{" "}
              <span className="text-primary font-bold">100 or more tokens</span>{" "}
              unlock a referral link in their account. When someone signs up using that link,{" "}
              <span className="text-primary font-bold">only the referrer gets 1 free draw token</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link href="/dashboard/referrals">
                <Button className="bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black hover:opacity-90 rounded-2xl h-12 px-6 font-bold text-sm shadow-[0_0_25px_rgba(255,215,0,0.3)]">
                  Go to Dashboard to Start Referring
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Simple Steps</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-white mb-3">
              How It Works
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
              Three easy steps to start earning free tokens for every friend you invite.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto relative">
            {/* Connector line (desktop only) */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 pointer-events-none" />

            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 shadow-lg ${s.bg}`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
                <div className="absolute top-0 right-0 sm:right-auto sm:left-[calc(50%+1.5rem)] w-5 h-5 rounded-full bg-[#0a0a0f] border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  {s.step}
                </div>
                <h3 className="font-bold font-heading text-white text-lg mb-2">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rewards Explanation ── */}
      <section className="py-16 bg-gradient-to-b from-zinc-950/50 to-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-white mb-3">
              Referral Eligibility <span className="text-primary">Rules</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
              Referral links are available only after buying 100 or more tokens. The reward goes to the account owner who shared the link.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            {REWARDS.map((r) => (
              <div
                key={r.label + r.sub}
                className="bg-card border border-white/10 rounded-2xl p-5 text-center hover:border-white/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <r.icon className={`w-5 h-5 ${r.color}`} />
                </div>
                <div className={`text-xl font-bold font-heading mb-1 ${r.color}`}>{r.label}</div>
                <div className="text-xs text-zinc-500 capitalize">{r.sub}</div>
              </div>
            ))}
          </div>

          <div className="max-w-xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-white font-semibold text-base sm:text-lg leading-relaxed">
              "Buy 100 or more tokens to unlock your referral link. If someone joins through your link,{" "}
              <span className="text-primary">you receive 1 free draw token</span> and the new user does not."
            </p>
            <p className="text-zinc-500 text-xs mt-2">Referral access appears only in eligible accounts.</p>
          </div>
        </div>
      </section>

      {/* ── Example Scenario ── */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-3">
                See It In Action
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base">
                Only eligible accounts can create and share referral links.
              </p>
            </div>

            <div className="bg-card border border-white/10 rounded-3xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-2 px-5 sm:px-6 py-3 bg-white/[0.03] border-b border-white/10">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <Users className="w-3.5 h-3.5" />
                  Friends Invited
                </div>
                <div className="flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <Ticket className="w-3.5 h-3.5" />
                  Free Tokens You Earn
                </div>
              </div>

              {EXAMPLE_ROWS.map((row, i) => (
                <div
                  key={row.friends}
                  className={`grid grid-cols-2 px-5 sm:px-6 py-4 border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02] ${
                    row.friends === 5 ? "bg-primary/5 border-primary/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      {Array.from({ length: Math.min(row.friends, 5) }).map((_, j) => (
                        <div
                          key={j}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-300"
                          style={{ zIndex: 5 - j }}
                        >
                          {j + 1}
                        </div>
                      ))}
                    </div>
                    <span className="font-bold text-white text-sm">
                      {row.friends} friend{row.friends !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className={`font-bold text-lg font-heading ${row.friends === 5 ? "text-primary" : "text-white"}`}>
                      {row.tokens} token{row.tokens !== 1 ? "s" : ""}
                    </span>
                    {row.friends === 5 && <Star className="w-4 h-4 fill-primary text-primary" />}
                  </div>
                </div>
              ))}

              <div className="px-5 sm:px-6 py-4 bg-white/[0.02] text-xs text-zinc-500 text-center">
                Referral links appear only after 100+ token purchases.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-zinc-950 to-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
            After buying 100 or more tokens, your dashboard will show your referral link.
          </p>
          <Link href="/dashboard/referrals">
            <Button className="bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black hover:opacity-90 rounded-2xl h-13 px-8 font-bold text-base shadow-[0_0_30px_rgba(255,215,0,0.3)] inline-flex items-center gap-2">
              Go to Dashboard to Start Referring
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-zinc-600 text-xs mt-4">Login required · 100+ token purchase required to refer</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
