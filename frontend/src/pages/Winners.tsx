import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { SiteFooter } from "@/components/SiteFooter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Search,
  Car,
  Bike,
  Wallet,
  Smartphone,
  ArrowRight,
  Eye,
  Sparkles,
  ShieldCheck,
  Hash,
  Users,
  Video,
  CheckCircle2,
  MapPin,
  Calendar,
  Ticket,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { publicApi, type ApiPublicWinner } from "@/lib/api";
import { usePageContent } from "@/hooks/usePageContent";

import luxuryCarImg from "@/assets/luxury-car.png";
import sportBikeImg from "@/assets/sport-bike.png";
import cashStacksImg from "@/assets/cash-stacks.png";
import goldTokenImg from "@/assets/gold-token.png";
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";
import avatar4 from "@/assets/avatar-4.png";

type PrizeCategory = "Cars" | "Bikes" | "Cash" | "Electronics";
type DateRange = "7d" | "30d" | "all";

type Winner = {
  id: string;
  name: string;
  city: string;
  prize: string;
  category: PrizeCategory;
  prizeImage: string;
  tokenId: string;
  date: string;
  daysAgo: number;
  avatar?: string;
};

function inferCategory(prize: string | null): PrizeCategory {
  if (!prize) return "Cash";
  const p = prize.toLowerCase();
  if (p.includes("bike") || p.includes("cd 70") || p.includes("yamaha") || p.includes("honda 1")) return "Bikes";
  if (p.includes("car") || p.includes("toyota") || p.includes("suzuki") || p.includes("corolla") || p.includes("mehran")) return "Cars";
  if (p.includes("pkr") || p.includes("cash") || p.includes("rupee")) return "Cash";
  return "Electronics";
}
function getPrizeImage(category: PrizeCategory): string {
  if (category === "Cars") return luxuryCarImg;
  if (category === "Bikes") return sportBikeImg;
  if (category === "Cash") return cashStacksImg;
  return goldTokenImg;
}
function calcDaysAgo(dateStr: string): number {
  try { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000); } catch { return 0; }
}
function mapApiWinner(w: ApiPublicWinner): Winner {
  const category = inferCategory(w.prize);
  const tokenLabel = w.tokenLabel || (w.tokenNumber != null ? `#${w.tokenNumber}` : `#${w.id}`);
  return {
    id: String(w.id),
    name: w.name,
    city: w.city,
    prize: w.prize ?? "Prize",
    category,
    prizeImage: w.imageUrl || getPrizeImage(category),
    tokenId: tokenLabel,
    date: w.dateLabel || (w.date ? new Date(w.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "TBD"),
    daysAgo: w.date ? calcDaysAgo(w.date) : 0,
    avatar: w.avatarUrl ?? undefined,
  };
}

const WINNERS: Winner[] = [
  { id: "w1", name: "Usman A***", city: "Karachi", prize: "PKR 500,000 Cash", category: "Cash", prizeImage: cashStacksImg, tokenId: "#B73921", date: "April 25, 2026", daysAgo: 5, avatar: avatar1 },
  { id: "w2", name: "Ali K***", city: "Lahore", prize: "Honda 125 Bike", category: "Bikes", prizeImage: sportBikeImg, tokenId: "#A78452", date: "April 20, 2026", daysAgo: 10, avatar: avatar2 },
  { id: "w3", name: "Farhan M***", city: "Islamabad", prize: "Toyota Corolla", category: "Cars", prizeImage: luxuryCarImg, tokenId: "#C72911", date: "April 15, 2026", daysAgo: 15, avatar: avatar3 },
  { id: "w4", name: "Sana A***", city: "Multan", prize: "PKR 200,000 Cash", category: "Cash", prizeImage: cashStacksImg, tokenId: "#B83921", date: "April 22, 2026", daysAgo: 8 },
  { id: "w5", name: "Bilal R***", city: "Faisalabad", prize: "Yamaha YBR 125", category: "Bikes", prizeImage: sportBikeImg, tokenId: "#A91142", date: "April 18, 2026", daysAgo: 12 },
  { id: "w6", name: "Zara H***", city: "Karachi", prize: "iPhone 15 Pro", category: "Electronics", prizeImage: goldTokenImg, tokenId: "#E55211", date: "April 28, 2026", daysAgo: 2, avatar: avatar4 },
  { id: "w7", name: "Hamza T***", city: "Rawalpindi", prize: "Suzuki Mehran", category: "Cars", prizeImage: luxuryCarImg, tokenId: "#C81029", date: "April 10, 2026", daysAgo: 20 },
  { id: "w8", name: "Ayesha F***", city: "Quetta", prize: "PKR 100,000 Cash", category: "Cash", prizeImage: cashStacksImg, tokenId: "#B92301", date: "April 27, 2026", daysAgo: 3 },
  { id: "w9", name: "Imran J***", city: "Peshawar", prize: "Honda CD 70", category: "Bikes", prizeImage: sportBikeImg, tokenId: "#A76011", date: "April 5, 2026", daysAgo: 25 },
  { id: "w10", name: "Nida S***", city: "Sialkot", prize: "PKR 50,000 Cash", category: "Cash", prizeImage: cashStacksImg, tokenId: "#B65512", date: "March 28, 2026", daysAgo: 33 },
  { id: "w11", name: "Tariq L***", city: "Lahore", prize: "Samsung S24 Ultra", category: "Electronics", prizeImage: goldTokenImg, tokenId: "#E48820", date: "March 20, 2026", daysAgo: 41 },
  { id: "w12", name: "Mehwish R***", city: "Hyderabad", prize: "Toyota Yaris", category: "Cars", prizeImage: luxuryCarImg, tokenId: "#C66201", date: "March 15, 2026", daysAgo: 46 },
];

export default function Winners() {
  const [apiWinners, setApiWinners] = useState<Winner[]>([]);

  useEffect(() => {
    publicApi.winners()
      .then((ws) => setApiWinners(ws.map(mapApiWinner)))
      .catch(() => {});
  }, []);

  const winners = apiWinners.length > 0 ? apiWinners : WINNERS;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <Hero winners={winners} />
      <FeaturedWinners winners={winners} />
      <AllWinnersSection winners={winners} />
      <SiteFooter />
    </div>
  );
}

function Hero({ winners }: { winners: Winner[] }) {
  const featured = winners.slice(0, 4);
  const [idx, setIdx] = useState(0);
  const { get: pg } = usePageContent("winners");
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % featured.length), 3500);
    return () => clearInterval(id);
  }, [featured.length]);
  const w = featured[idx];

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/[0.10] blur-[140px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)`, backgroundSize: "56px 56px" }} />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Hall of Winners</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-heading font-bold leading-[1.05] tracking-tight text-white text-[44px] sm:text-[58px] lg:text-[68px] mb-5">
            Real Winners. <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">Real Prizes.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-zinc-400 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            {pg("hero_subtitle", "Thousands of people across Pakistan have already won cars, bikes, and cash through Kaptan Lucky Draw — every win publicly verified.")}
          </motion.p>
          <div className="max-w-2xl mx-auto mb-10">
            <AnimatePresence mode="wait">
              <motion.div key={w.id} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.4 }} className="relative bg-gradient-to-br from-card to-zinc-950 border border-primary/30 rounded-3xl p-6 lg:p-7 shadow-[0_20px_60px_-20px_rgba(255,215,0,0.25)] text-left">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_4px_12px_rgba(255,215,0,0.4)]">
                  <Trophy className="w-3 h-3" />
                  Latest Winner
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFE066] to-[#FFB800] p-[2.5px] shadow-[0_4px_18px_rgba(255,215,0,0.45)]">
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-black text-white">
                        {w.avatar ? <img src={w.avatar} alt={w.name} className="w-full h-full rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} /> : w.name[0]}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-lg truncate">{w.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500"><MapPin className="w-3 h-3" />{w.city}</span>
                    </div>
                    <div className="text-primary font-bold text-base mb-1.5 leading-tight">Won {w.prize}</div>
                    <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-mono text-zinc-300">
                      <Hash className="w-3 h-3 text-primary" />Token ID: {w.tokenId}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Link href="/draws"><Button size="lg" className="bg-gradient-to-b from-[#FFE066] to-[#FFB800] text-black hover:opacity-95 transition-all rounded-xl font-bold text-base px-8 h-13 group shadow-[0_8px_24px_rgba(255,215,0,0.35)] border-none"><Trophy className="w-5 h-5 mr-2" />Join Next Draw<ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></Button></Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeaturedWinners({ winners }: { winners: Winner[] }) {
  const featured = winners.slice(0, 3);
  return (
    <section className="py-20 lg:py-24 bg-zinc-950/50 relative overflow-hidden border-y border-white/5">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Spotlight</span></div>
          <h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">Featured <span className="text-primary">Winners</span></h2>
          <p className="text-muted-foreground text-lg">Recent big winners — verified and publicly announced.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {featured.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }} className="group relative bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-6 hover:border-primary/50 transition-all hover:shadow-[0_20px_50px_-15px_rgba(255,215,0,0.25)] flex flex-col">
              <div className="flex justify-between items-center mb-5"><div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400"><CheckCircle2 className="w-3 h-3" />Verified</div><div className="text-[11px] font-mono text-zinc-500 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">{w.tokenId}</div></div>
              <div className="relative h-44 flex items-center justify-center mb-5"><div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" /><img src={w.prizeImage} alt={w.prize} className="w-full h-full object-contain relative z-10 drop-shadow-xl group-hover:scale-105 transition-transform duration-500" onError={(e) => (e.currentTarget.style.display = "none")} /><div className="absolute bottom-0 left-0 z-20"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFE066] to-[#FFB800] p-[2.5px] shadow-[0_4px_14px_rgba(255,215,0,0.45)]"><div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xl font-black text-white overflow-hidden">{w.avatar ? <img src={w.avatar} alt={w.name} className="w-full h-full rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} /> : w.name[0]}</div></div></div></div>
              <h3 className="text-2xl font-bold font-heading text-white mb-1.5">{w.name}</h3><div className="inline-flex items-center gap-1.5 text-xs text-zinc-400 mb-4"><MapPin className="w-3.5 h-3.5 text-primary" />{w.city}</div>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4"><div className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">Won</div><div className="text-xl font-bold font-heading text-primary leading-tight">{w.prize}</div></div>
              <div className="flex items-center justify-between text-[11px] mb-5"><span className="text-zinc-500 inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{w.date}</span><span className="text-emerald-400 font-bold">{w.daysAgo} days ago</span></div>
              <Link href="/draws" className="mt-auto"><Button variant="outline" className="w-full bg-transparent border-white/15 hover:border-primary/40 hover:bg-primary/5 text-white h-11 rounded-xl font-bold text-sm group/btn"><Eye className="w-4 h-4 mr-2" />View Draw Details<ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" /></Button></Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AllWinnersSection({ winners }: { winners: Winner[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | PrizeCategory>("All");
  const [range, setRange] = useState<DateRange>("all");
  const filtered = useMemo(() => {
    let list = [...winners];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((w) => w.name.toLowerCase().includes(q) || w.tokenId.toLowerCase().includes(q) || w.city.toLowerCase().includes(q));
    }
    if (category !== "All") list = list.filter((w) => w.category === category);
    if (range !== "all") {
      const cap = range === "7d" ? 7 : 30;
      list = list.filter((w) => w.daysAgo <= cap);
    }
    return list;
  }, [search, category, range, winners]);
  const clearAll = () => { setSearch(""); setCategory("All"); setRange("all"); };
  const hasFilters = search.trim() || category !== "All" || range !== "all";
  return (
    <section className="py-20 lg:py-24 relative overflow-hidden"><div className="container mx-auto px-6 relative z-10"><div className="text-center max-w-3xl mx-auto mb-12"><div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-5"><Users className="w-3.5 h-3.5 text-primary" /><span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">All Time</span></div><h2 className="text-3xl lg:text-5xl font-bold font-heading mb-3">All <span className="text-primary">Winners</span></h2><p className="text-muted-foreground text-lg">Browse every verified winner. Filter by date or prize type.</p></div><div className="mt-8 bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl overflow-hidden"><div className="hidden md:grid grid-cols-12 gap-3 bg-white/5 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 border-b border-white/5"><div className="col-span-3">Winner</div><div className="col-span-2">City</div><div className="col-span-3">Prize</div><div className="col-span-2">Date</div><div className="col-span-2">Token ID</div></div><div className="divide-y divide-white/5">{filtered.map((w) => (<div key={w.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-6 py-4 items-center"><div className="md:col-span-3">{w.name}</div><div className="md:col-span-2">{w.city}</div><div className="md:col-span-3">{w.prize}</div><div className="md:col-span-2">{w.date}</div><div className="md:col-span-2">{w.tokenId}</div></div>))}</div></div></div></section>
  );
}
