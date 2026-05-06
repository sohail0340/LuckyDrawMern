import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, ShieldCheck,
  Sparkles, Trophy,
  ChevronRight, Ticket,
  Clock, ArrowRight, Eye,
  Plus, HelpCircle,
  Loader2, ImageIcon,
} from "lucide-react";
import { publicApi, type ApiPublicDraw } from "@/lib/api";
import { fixImageUrl } from "@/lib/imageUrl";
import { usePageContent } from "@/hooks/usePageContent";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { PaymentTrust } from "@/components/PaymentTrust";


function FeaturedDrawsSection() {
  const [draws, setDraws] = useState<ApiPublicDraw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.activeDraws()
      .then(data => setDraws(data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPrize = draws.reduce((s, d) => s + d.prizeValuePkr, 0);
  const totalTokens = draws.reduce((s, d) => s + d.tokensSold, 0);

  function fmtPkr(n: number) {
    if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (n >= 1_000) return `PKR ${(n / 1_000).toFixed(0)}K+`;
    return `PKR ${n.toLocaleString()}`;
  }

  const catLabel: Record<string, string> = {
    cars: "Car Draw", bikes: "Bike Draw", cash: "Cash Draw",
    electronics: "Electronics", property: "Property", custom: "Lucky Draw",
  };

  return (
    <section id="prizes" className="py-20 lg:py-24 bg-zinc-950 relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0f_85%)]" />
      </div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,215,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.5) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              {loading ? "Loading…" : draws.length > 0 ? `${draws.length} Active Draw${draws.length !== 1 ? "s" : ""}` : "No Active Draws"}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            className="text-3xl lg:text-5xl font-bold font-heading mb-5">
            Live <span className="text-primary">Draws</span> Right Now
          </motion.h2>

          <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg">
            Purchase tokens for the specific prize you want. Draws happen live when the token limit is reached.
          </motion.p>

          {!loading && draws.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 mt-7 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <Trophy className="w-4 h-4 text-primary" />
                <span><span className="font-bold text-white">{fmtPkr(totalPrize)}</span> in active prizes</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2 text-zinc-400">
                <Ticket className="w-4 h-4 text-primary" />
                <span><span className="font-bold text-white">{(totalTokens ?? 0).toLocaleString()}</span> tokens sold</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Verified</span>
              </div>
            </motion.div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {!loading && draws.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No active draws right now</h3>
            <p className="text-zinc-500 text-sm mb-6">Check back soon — new draws are added regularly.</p>
            <Link href="/draws">
              <Button className="bg-primary text-black hover:bg-yellow-400 font-bold rounded-xl px-6">
                View All Draws
              </Button>
            </Link>
          </div>
        )}

        {!loading && draws.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {draws.map((draw, i) => {
                const pct = draw.tokenLimit > 0 ? Math.round((draw.tokensSold / draw.tokenLimit) * 100) : 0;
                const almostFull = pct >= 85;
                const label = catLabel[draw.category] ?? "Lucky Draw";
                return (
                  <motion.div key={draw.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="group bg-card border border-white/5 rounded-3xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] flex flex-col">
                    <div className="flex items-center justify-end mb-4 text-xs text-zinc-400">
                      <span><span className="font-bold text-white">{(draw.tokensSold ?? 0).toLocaleString()}</span> tokens sold</span>
                    </div>

                    <div className="flex justify-between items-center mb-5">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Verified Draw
                      </div>
                      {almostFull ? (
                        <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Almost Full
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live Now
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-white/5 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-medium text-zinc-300 border border-white/10">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                        {label}
                      </div>
                      <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
                        <Flame className="w-4 h-4" />Hot
                      </div>
                    </div>

                    <div className="h-44 flex items-center justify-center mb-5 relative">
                      <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />
                      {fixImageUrl(draw.imageUrl) ? (
                        <img src={fixImageUrl(draw.imageUrl)!} alt={draw.name}
                          className="w-full h-full object-contain relative z-10 drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="relative z-10 flex flex-col items-center gap-2 text-zinc-600">
                          <ImageIcon className="w-12 h-12" />
                          <span className="text-xs">{label}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold font-heading mb-2">{draw.name}</h3>

                    <div className="flex items-baseline gap-3 mb-5 flex-wrap">
                      <span className="text-2xl font-bold text-primary">PKR {(draw.prizeValuePkr ?? 0).toLocaleString()}</span>
                      <span className="text-xs text-zinc-400">PKR {draw.tokenPricePkr} / token</span>
                    </div>

                    <Countdown endsAt={draw.endsAt} />

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link href={`/draws/${draw.id}`}>
                        <Button variant="outline" className="w-full bg-transparent border-white/15 hover:border-white/30 hover:bg-white/5 text-white h-11 rounded-xl font-semibold text-sm">
                          <Ticket className="w-4 h-4 mr-1.5" />View Details
                        </Button>
                      </Link>
                      <Link href={`/draws/${draw.id}`}>
                        <Button className="w-full bg-primary text-black hover:bg-yellow-400 h-11 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,215,0,0.25)]">
                          <Ticket className="w-4 h-4 mr-1.5" />Join Now
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Link href="/draws">
                <Button variant="outline" className="bg-transparent border-white/15 hover:border-primary/50 hover:bg-primary/5 text-white rounded-xl px-8 h-12 font-semibold">
                  <Eye className="w-4 h-4 mr-2" />View All Draws
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function HomeHowItWorksCards() {
  const { get: pg } = usePageContent("home");
  const items = [
    {
      step: "01",
      title: pg("hiw_step1_title", "Buy a Token"),
      desc: pg("hiw_step1_desc", "Select the prize you want to win and purchase a token starting from just Rs. 100. Payments are secure."),
      icon: Ticket,
      href: "/draws",
      cta: "Get a Token",
      external: false,
    },
    {
      step: "02",
      title: pg("hiw_step2_title", "Wait for the Target"),
      desc: pg("hiw_step2_desc", "Each draw has a fixed number of tokens. The draw triggers automatically once all tokens are sold."),
      icon: Clock,
      href: "#prizes",
      cta: "See Active Draws",
      external: true,
    },
    {
      step: "03",
      title: pg("hiw_step3_title", "Live Draw & Win"),
      desc: pg("hiw_step3_desc", "Watch the draw live. Our provably fair system selects a winner randomly. Instant payout/delivery."),
      icon: Trophy,
      href: "/draws",
      cta: "View Draws",
      external: false,
    },
  ];
  return (
    <>
      {items.map((item, i) => {
        const cardInner = (
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative h-full bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-8 text-center cursor-pointer overflow-hidden hover:border-primary/50 hover:shadow-[0_20px_60px_-15px_rgba(255,215,0,0.25)] transition-all duration-300"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
            </div>
            <div className="absolute top-3 right-5 text-7xl font-black font-heading text-white/[0.04] select-none pointer-events-none leading-none">
              {item.step}
            </div>
            <div className="relative z-10 mx-auto mb-7 w-fit">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-3xl group-hover:bg-primary/50 transition-colors duration-300" />
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1a1a22] to-[#0d0d12] border border-primary/30 flex items-center justify-center group-hover:border-primary/70 group-hover:scale-110 transition-all duration-300 shadow-inner">
                <item.icon className="w-9 h-9 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-[#FFE066] to-[#FFB800] flex items-center justify-center text-xs font-black text-black shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
                {item.step}
              </div>
            </div>
            <h3 className="relative z-10 text-2xl font-bold font-heading mb-3 group-hover:text-primary transition-colors duration-300">
              {item.title}
            </h3>
            <p className="relative z-10 text-muted-foreground leading-relaxed mb-6 text-sm">
              {item.desc}
            </p>
            <div className="relative z-10 inline-flex items-center gap-2 text-primary font-bold text-sm border-b border-primary/0 group-hover:border-primary/60 pb-1 transition-all duration-300">
              {item.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </motion.div>
        );
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="group relative z-10"
          >
            {item.external ? (
              <a href={item.href} className="block h-full">{cardInner}</a>
            ) : (
              <Link href={item.href} className="block h-full">{cardInner}</Link>
            )}
          </motion.div>
        );
      })}
    </>
  );
}

function HomeFaqList() {
  const { get: pg } = usePageContent("home");
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: pg("faq1_q", "Is Kaptan Lucky Draw legal in Pakistan?"), a: pg("faq1_a", "Yes. We operate as a paid token-based prize draw, fully compliant with Pakistani law. All draws are transparent and verifiable.") },
    { q: pg("faq2_q", "How much does one token cost?"), a: pg("faq2_a", "One token costs Rs. 100. Each draw has a fixed token pool; once all tokens are sold, the draw is triggered automatically.") },
    { q: pg("faq3_q", "How are winners selected?"), a: pg("faq3_a", "Winners are selected using a cryptographic random seed posted on-chain before the draw. You can verify the result using the draw hash provided after each draw.") },
    { q: pg("faq4_q", "How do I receive my prize?"), a: pg("faq4_a", "Cash prizes are sent to your JazzCash/EasyPaisa account within 24 hours. Physical prizes (cars, bikes) are handed over at our Lahore office or shipped — you'll be contacted by our team.") },
    { q: pg("faq5_q", "Can I buy multiple tokens for the same draw?"), a: pg("faq5_a", "Yes! You can buy as many tokens as you like for any single draw, which increases your chances of winning proportionally.") },
    { q: pg("faq6_q", "What payment methods are accepted?"), a: pg("faq6_a", "We accept JazzCash, EasyPaisa, and bank transfers. All payment details are shown at checkout after you select a draw.") },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-12">
      {faqs.map((faq, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openIdx === i ? "border-primary/50 bg-gradient-to-br from-card to-zinc-950 shadow-[0_0_30px_rgba(255,215,0,0.08)]" : "border-white/10 bg-card hover:border-white/20"}`}
        >
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${openIdx === i ? "bg-primary text-black" : "bg-white/5 text-zinc-400"}`}>
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <span className={`font-semibold text-sm leading-snug ${openIdx === i ? "text-primary" : "text-white"}`}>{faq.q}</span>
            </div>
            <Plus className={`w-4 h-4 shrink-0 transition-all duration-300 ${openIdx === i ? "rotate-45 text-primary" : "text-zinc-500"}`} />
          </button>
          <AnimatePresence initial={false}>
            {openIdx === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 pt-1 text-zinc-400 text-sm leading-relaxed border-t border-white/5">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <StatsBar />
      <PaymentTrust />

      {/* Featured Prizes Section */}
      <FeaturedDrawsSection />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[140px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-yellow-500/[0.04] rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)`,
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                How It Works
              </span>
            </motion.div>
            <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-5">
              Transparent <span className="text-primary">&</span> Simple
            </h2>
            <p className="text-muted-foreground text-lg">
              We operate on complete transparency. Every draw is verifiable, and winners are announced publicly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
            <div className="hidden md:block absolute top-20 left-[16%] right-[16%] h-[2px] z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <motion.div
                initial={{ x: "-30%", opacity: 0 }}
                whileInView={{ x: "130%", opacity: [0, 1, 0] }}
                viewport={{ once: false }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(255,215,0,0.8)]"
              />
            </div>

            <HomeHowItWorksCards />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.05] rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-yellow-500/[0.04] rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Got Questions?
              </span>
            </motion.div>
            <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-5">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know before joining your first draw.
            </p>
          </div>

          <HomeFaqList />
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className={`group bg-gradient-to-br rounded-2xl border overflow-hidden transition-all duration-300 ${
              isOpen
                ? "from-card to-zinc-900 border-primary/40 shadow-[0_8px_30px_-10px_rgba(255,215,0,0.2)]"
                : "from-card to-zinc-950 border-white/10 hover:border-primary/30 hover:bg-white/[0.02]"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
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
                <Plus className={`w-4 h-4 ${isOpen ? "text-primary" : "text-zinc-400"}`} strokeWidth={2.5} />
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
                    <div className="border-l-2 border-primary/30 pl-4">
                      {faq.a}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function Countdown({ endsAt: endsAtProp }: { endsAt: string | null }) {
  const target = endsAtProp ? new Date(endsAtProp).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  const segments: { value: string; label: string }[] = [
    { value: pad(days), label: "Days" },
    { value: pad(hours), label: "Hrs" },
    { value: pad(mins), label: "Min" },
    { value: pad(secs), label: "Sec" },
  ];

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 mb-4 flex items-center justify-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-primary mr-1 shrink-0" />
      {segments.map((seg, idx) => (
        <div key={seg.label} className="flex items-center gap-1.5">
          <div className="text-center min-w-[28px]">
            <div className="text-base font-bold font-mono text-white tabular-nums leading-none">{seg.value}</div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">{seg.label}</div>
          </div>
          {idx < segments.length - 1 && <span className="text-primary font-bold text-base leading-none">:</span>}
        </div>
      ))}
    </div>
  );
}
