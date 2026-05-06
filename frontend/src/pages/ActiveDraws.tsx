import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, Bike, Wallet, Smartphone, Flame, Ticket, Clock, Search,
  Sparkles, Trophy, ArrowRight, Filter as FilterIcon, X, Users,
  TrendingUp, ChevronDown, Star, Loader2, ImageIcon, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { publicApi, type ApiPublicDraw, type ApiSiteStats } from "@/lib/api";
import { fixImageUrl } from "@/lib/imageUrl";

import goldTokenImg from "@/assets/gold-token.png";
import avatar1 from "@/assets/avatar-1.png";
import avatar2 from "@/assets/avatar-2.png";
import avatar3 from "@/assets/avatar-3.png";

type Category = "All" | string;
type PriceRange = "All" | "Under100" | "100to500" | "500plus";
type SortKey = "endingSoon" | "popular" | "lowestPrice" | "highestPrize";
type StatusFilter = "active" | "completed" | "all";

const CAT_ICONS: Record<string, typeof Car> = {
  cars: Car, bikes: Bike, cash: Wallet, electronics: Smartphone,
};

function getCatIcon(cat: string): typeof Car {
  return CAT_ICONS[cat?.toLowerCase()] ?? Star;
}

function daysLeft(endsAt: string | null): number {
  if (!endsAt) return 999;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function fmtPkr(n: number) {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `PKR ${(n / 1_000).toFixed(0)}K`;
  return `PKR ${n.toLocaleString()}`;
}

function hasBadge(badges: string | null, key: string) {
  return badges?.split(",").map(b => b.trim()).includes(key) ?? false;
}

export default function ActiveDraws() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />
      <Header />
      <DrawsSection />
      <SecondaryCTA />
      <SiteFooter />
    </div>
  );
}

function HeaderStats() {
  const [stats, setStats] = useState<ApiSiteStats | null>(null);
  const [draws, setDraws] = useState<ApiPublicDraw[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () => {
      publicApi.siteStats().then((data) => { if (alive) setStats(data); }).catch(() => {});
      publicApi.activeDraws().then((data) => {
        if (!alive) return;
        setDraws(Array.isArray(data) ? data : []);
      }).catch(() => {
        if (!alive) return;
        setDraws([]);
      });
    };
    load();
    const id = window.setInterval(load, 10000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);
  const safeDraws = Array.isArray(draws) ? draws : [];
  const activeCount = safeDraws.filter(d => d.status === "active").length;
  const items = [
    { label: "Live Draws", value: activeCount > 0 ? String(activeCount) : "Active", icon: Sparkles },
    { label: "Happy Users", value: stats ? (stats.happyUsersCount >= 1000 ? `${(stats.happyUsersCount / 1000).toFixed(1)}K+` : `${stats.happyUsersCount}+`) : "—", icon: Users },
    { label: "Tokens Sold", value: stats ? (stats.tokensSoldCount >= 1000 ? `${(stats.tokensSoldCount / 1000).toFixed(1)}K+` : String(stats.tokensSoldCount)) : "—", icon: TrendingUp },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
      className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
      {items.map((s, i) => (
        <div key={i} className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 hover:border-primary/30 transition-colors">
          <s.icon className="w-4 h-4 text-primary mx-auto mb-2" />
          <div className="text-lg lg:text-xl font-bold font-heading text-white">{s.value}</div>
          <div className="text-[9px] uppercase tracking-wider text-zinc-500 mt-0.5 font-semibold">{s.label}</div>
        </div>
      ))}
    </motion.div>
  );
}

function Header() {
  return (
    <section className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.10] blur-[140px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(rgba(255,215,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.6) 1px, transparent 1px)`, backgroundSize: "56px 56px" }} />
      </div>
      {[{ top: "30%", left: "6%", delay: 0, size: 50 }, { top: "65%", left: "10%", delay: 1, size: 38 }, { top: "30%", right: "8%", delay: 0.5, size: 48 }]
        .map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0], rotate: [0, 6, 0] }}
            transition={{ opacity: { duration: 0.6, delay: p.delay }, scale: { duration: 0.6, delay: p.delay }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: p.delay }, rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: p.delay } }}
            className="absolute hidden md:block pointer-events-none"
            style={{ top: p.top, left: (p as any).left, right: (p as any).right, width: p.size, height: p.size }}>
            <img src={goldTokenImg} alt="" className="w-full h-full object-contain drop-shadow-[0_0_18px_rgba(255,215,0,0.4)]" onError={e => (e.currentTarget.style.display = "none")} />
          </motion.div>
        ))}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-5">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">Live Right Now</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="font-heading font-bold leading-[1.05] tracking-tight text-white text-[40px] sm:text-[52px] lg:text-[60px] mb-4">
            Active <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B]">Lucky Draws</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-zinc-400 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed mb-3">
            Browse all currently available draws and choose your chance to win exciting prizes.
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
            className="text-zinc-500 text-sm max-w-xl mx-auto mb-10">
            Buy tokens, secure your entries, and participate before the draw closes.
          </motion.p>
          <HeaderStats />
        </div>
      </div>
    </section>
  );
}

const PAGE_SIZE = 6;

function DrawsSection() {
  const [draws, setDraws] = useState<ApiPublicDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [price, setPrice] = useState<PriceRange>("All");
  const [sort, setSort] = useState<SortKey>("endingSoon");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let alive = true;
    const load = () => {
      publicApi.activeDraws()
        .then((data) => {
          if (!alive) return;
          setDraws(Array.isArray(data) ? data : []);
          setError(null);
          setLoading(false);
        })
        .catch(() => {
          if (!alive) return;
          setDraws([]);
          setError("Could not load draws. Please try again later.");
          setLoading(false);
        });
    };
    setLoading(true);
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const safeDraws = Array.isArray(draws) ? draws : [];

  const categories = useMemo(() => {
    const cats = [...new Set(safeDraws.map(d => d.category?.toLowerCase()))].filter(Boolean);
    return ["All", ...cats.map(c => c.charAt(0).toUpperCase() + c.slice(1))];
  }, [safeDraws]);

  const filtered = useMemo(() => {
    let list = [...safeDraws];
    if (statusFilter === "active") list = list.filter(d => d.status === "active");
    else if (statusFilter === "completed") list = list.filter(d => d.status === "drawn");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.prize.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
    }
    if (category !== "All") list = list.filter(d => d.category.toLowerCase() === category.toLowerCase());
    if (price !== "All") list = list.filter(d => {
      if (price === "Under100") return d.tokenPricePkr < 100;
      if (price === "100to500") return d.tokenPricePkr >= 100 && d.tokenPricePkr <= 500;
      return d.tokenPricePkr > 500;
    });
    list.sort((a, b) => {
      if (sort === "endingSoon") return daysLeft(a.endsAt) - daysLeft(b.endsAt);
      if (sort === "popular") return (Number(b.tokensSold) / b.tokenLimit) - (Number(a.tokensSold) / a.tokenLimit);
      if (sort === "lowestPrice") return a.tokenPricePkr - b.tokenPricePkr;
      return b.prizeValuePkr - a.prizeValuePkr;
    });
    return list;
  }, [draws, search, category, price, sort, statusFilter]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [search, category, price, sort, statusFilter]);

  const hasMore = visible < filtered.length;
  const showing = filtered.slice(0, visible);
  const hasActiveFilters = search.trim() || category !== "All" || price !== "All" || sort !== "endingSoon";

  const clearFilters = () => { setSearch(""); setCategory("All"); setPrice("All"); setSort("endingSoon"); };

  const activeCount = safeDraws.filter(d => d.status === "active").length;
  const completedCount = safeDraws.filter(d => d.status === "drawn").length;

  if (loading) return (
    <section className="py-20 bg-zinc-950/50 border-y border-white/5 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Loading draws…</span>
      </div>
    </section>
  );

  if (error) return (
    <section className="py-20 bg-zinc-950/50 border-y border-white/5 flex items-center justify-center">
      <div className="text-center"><p className="text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </section>
  );

  return (
    <section className="py-10 lg:py-14 bg-zinc-950/50 relative overflow-hidden border-y border-white/5">
      <div className="container mx-auto px-6 relative z-10">
        {/* Status tab strip */}
        <div className="flex items-center gap-2 mb-6">
          {([
            { key: "active", label: "Active Draws", count: activeCount },
            { key: "completed", label: "Completed", count: completedCount },
            { key: "all", label: "All", count: safeDraws.length },
          ] as { key: StatusFilter; label: string; count: number }[]).map(tab => (
            <button key={tab.key} type="button" onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                statusFilter === tab.key
                  ? tab.key === "completed"
                    ? "bg-zinc-500/20 border border-zinc-500/50 text-zinc-200"
                    : "bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black shadow-[0_4px_12px_rgba(255,215,0,0.35)]"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}>
              {tab.key === "completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {tab.key === "active" && <span className="w-2 h-2 rounded-full bg-current" />}
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key && tab.key !== "completed"
                  ? "bg-black/20 text-inherit"
                  : "bg-white/10 text-zinc-400"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        <FilterBar search={search} setSearch={setSearch} category={category} setCategory={setCategory}
          price={price} setPrice={setPrice} sort={sort} setSort={setSort}
          totalActive={filtered.length} totalAll={safeDraws.length} categories={categories}
          hasActiveFilters={!!hasActiveFilters} clearFilters={clearFilters} />
        {showing.length === 0 ? (
          <EmptyState onClear={clearFilters} hasFilters={!!hasActiveFilters} statusFilter={statusFilter} />
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
              <AnimatePresence mode="popLayout">
                {showing.map((draw, i) => <DrawCard key={draw.id} draw={draw} index={i} />)}
              </AnimatePresence>
            </div>
            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button onClick={() => setVisible(v => v + PAGE_SIZE)} variant="outline"
                  className="border-2 border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/70 text-primary rounded-xl font-bold px-8 h-12 group">
                  Load More Draws <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
                </Button>
              </div>
            )}
            <div className="text-center mt-6 text-sm text-zinc-500">
              Showing <span className="font-bold text-white">{showing.length}</span> of{" "}
              <span className="font-bold text-white">{filtered.length}</span> draws
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FilterBar({ search, setSearch, category, setCategory, price, setPrice, sort, setSort,
  totalActive, totalAll, categories, hasActiveFilters, clearFilters }: {
  search: string; setSearch: (v: string) => void;
  category: Category; setCategory: (v: Category) => void;
  price: PriceRange; setPrice: (v: PriceRange) => void;
  sort: SortKey; setSort: (v: SortKey) => void;
  totalActive: number; totalAll: number; categories: string[];
  hasActiveFilters: boolean; clearFilters: () => void;
}) {
  const prices: { key: PriceRange; label: string }[] = [
    { key: "All", label: "Any Price" }, { key: "Under100", label: "Under Rs.100" },
    { key: "100to500", label: "Rs.100 – 500" }, { key: "500plus", label: "Rs.500+" },
  ];
  const sorts: { key: SortKey; label: string }[] = [
    { key: "endingSoon", label: "Ending Soon" }, { key: "popular", label: "Most Popular" },
    { key: "lowestPrice", label: "Lowest Token Price" }, { key: "highestPrize", label: "Highest Prize Value" },
  ];

  return (
    <div className="bg-gradient-to-br from-card to-zinc-950 border border-white/10 rounded-3xl p-5 lg:p-6 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder='Search prizes — try "Bike", "Cash", or "iPhone"...'
            className="pl-10 h-12 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50" />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="relative shrink-0">
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            className="appearance-none h-12 bg-black/40 border border-white/10 text-white rounded-xl pl-11 pr-10 font-semibold text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 cursor-pointer min-w-[220px]">
            {sorts.map(s => <option key={s.key} value={s.key} className="bg-zinc-900">Sort: {s.label}</option>)}
          </select>
          <FilterIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mr-1">Prize:</span>
        {categories.map(c => {
          const Icon = getCatIcon(c);
          const active = category === c;
          return (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${active ? "bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black shadow-[0_4px_12px_rgba(255,215,0,0.35)]" : "bg-white/5 border border-white/10 text-zinc-300 hover:border-primary/30 hover:text-primary"}`}>
              {c !== "All" && <Icon className="w-3.5 h-3.5" />}
              {c}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mr-1">Price:</span>
          {prices.map(p => (
            <button key={p.key} type="button" onClick={() => setPrice(p.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${price === p.key ? "bg-primary/15 border border-primary/50 text-primary" : "bg-white/5 border border-white/10 text-zinc-300 hover:border-primary/30 hover:text-primary"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="text-xs text-zinc-400"><span className="font-bold text-white">{totalActive}</span> of <span className="font-bold text-white">{totalAll}</span> matching</div>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawCard({ draw, index }: { draw: ApiPublicDraw; index: number }) {
  const Icon = getCatIcon(draw.category);
  const sold = Number(draw.tokensSold ?? 0);
  const limit = Number(draw.tokenLimit ?? 1);
  const pct = limit > 0 ? Math.round((sold / limit) * 100) : 0;
  const days = daysLeft(draw.endsAt);
  const isHot = hasBadge(draw.badges, "hot") || pct >= 70;
  const badgeList = draw.badges?.split(",").map(b => b.trim()).filter(Boolean) ?? [];
  const isCompleted = draw.status === "drawn";

  function renderBadge(key: string) {
    const map: Record<string, { cls: string; label: string; dot?: boolean }> = {
      "verified":     { cls: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400", label: "Verified Draw", dot: true },
      "live-now":     { cls: "bg-red-500/10 border border-red-500/30 text-red-400",             label: "Live Now",       dot: true },
      "hot":          { cls: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400",    label: "Hot 🔥" },
      "new":          { cls: "bg-sky-500/10 border border-sky-500/30 text-sky-400",             label: "New Draw" },
      "ending-soon":  { cls: "bg-red-500/10 border border-red-500/30 text-red-400",             label: "Ending Soon",    dot: true },
      "almost-full":  { cls: "bg-orange-500/10 border border-orange-500/30 text-orange-400",    label: "Almost Full",    dot: true },
    };
    const m = map[key];
    if (!m) return <span key={key} className="inline-flex items-center gap-1 bg-zinc-500/10 border border-zinc-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">{key}</span>;
    return (
      <span key={key} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${m.cls}`}>
        {m.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
        {m.label}
      </span>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      transition={{ delay: Math.min(index, 6) * 0.05 }}
      className={`group bg-card border rounded-3xl p-6 transition-all duration-300 flex flex-col ${
        isCompleted
          ? "border-white/5 opacity-80"
          : "border-white/5 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]"
      }`}>

      {/* Badges */}
      {isCompleted ? (
        <div className="flex justify-between items-center mb-5">
          <div className="inline-flex items-center gap-1.5 bg-zinc-500/10 border border-zinc-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <CheckCircle2 className="w-3 h-3" />Draw Completed
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Closed
          </div>
        </div>
      ) : badgeList.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {badgeList.map(renderBadge)}
        </div>
      ) : (
        <div className="flex justify-between items-center mb-5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Verified Draw
          </div>
          <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live Now
          </div>
        </div>
      )}

      {/* Category + Hot */}
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/5 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-medium text-zinc-300 border border-white/10">
          <Icon className="w-3.5 h-3.5 text-primary" />
          {draw.category.charAt(0).toUpperCase() + draw.category.slice(1)}
        </div>
        {!isCompleted && isHot && (
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <Flame className="w-4 h-4" />Hot
          </div>
        )}
      </div>

      {/* Image */}
      <div className="h-44 flex items-center justify-center mb-5 relative">
        <div className={`absolute inset-0 rounded-full blur-2xl transition-colors duration-500 ${
          isCompleted ? "bg-zinc-500/5" : "bg-primary/5 group-hover:bg-primary/20"
        }`} />
        {fixImageUrl(draw.imageUrl) ? (
          <img src={fixImageUrl(draw.imageUrl)!} alt={draw.name}
            className={`w-full h-full object-contain relative z-10 drop-shadow-xl transition-transform duration-500 ${
              isCompleted ? "grayscale opacity-60" : "group-hover:scale-105"
            }`}
            onError={e => { e.currentTarget.style.display = "none"; (e.currentTarget.nextSibling as HTMLElement)?.classList.remove("hidden"); }} />
        ) : null}
        <div className={`${fixImageUrl(draw.imageUrl) ? "hidden" : "flex"} flex-col items-center justify-center gap-2 relative z-10 text-zinc-600`}>
          <ImageIcon className="w-10 h-10" /><span className="text-xs">No image yet</span>
        </div>
      </div>

      <h3 className="text-2xl font-bold font-heading mb-2">{draw.name}</h3>

      <div className="flex items-baseline gap-3 mb-5 flex-wrap">
        <span className={`text-2xl font-bold ${isCompleted ? "text-zinc-400" : "text-primary"}`}>{fmtPkr(draw.prizeValuePkr)}</span>
        <span className="text-xs text-zinc-400">PKR {draw.tokenPricePkr} / token</span>
      </div>

      {/* Winner banner for completed draws */}
      {isCompleted && draw.winner && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80 mb-0.5">Winner</div>
            <div className="text-xs font-bold text-emerald-400">{draw.winner.name} · {draw.winner.city}</div>
          </div>
        </div>
      )}

      {!isCompleted && (
        <>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">Entries</div>
                <div className="text-xs font-bold text-emerald-400">Unlimited</div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-primary shrink-0" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Per Token</div>
                <div className="text-xs font-bold text-white">PKR {draw.tokenPricePkr}</div>
              </div>
            </div>
          </div>

          {draw.endsAt && (
            <div className="bg-black/30 border border-white/8 rounded-xl px-3 py-2.5 mb-5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="text-xs text-zinc-400">
                {days === 0 ? <span className="text-red-400 font-bold">Ending Today!</span>
                  : days <= 2 ? <span className="text-orange-400 font-bold">Ending in {days} day{days !== 1 ? "s" : ""}</span>
                  : <span>Ends <strong className="text-white">{new Date(draw.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</strong></span>}
              </div>
            </div>
          )}
        </>
      )}

      <div className={`gap-3 mt-auto ${isCompleted ? "flex" : "grid grid-cols-2"}`}>
        <Link href={`/draws/${draw.id}`} className={`border-2 border-white/10 hover:border-white/20 text-white h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors hover:bg-white/5 ${isCompleted ? "flex-1" : "w-full"}`}>
          View Details
        </Link>
        {!isCompleted && (
          <Link href={`/draws/${draw.id}`} className="w-full bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
            <Ticket className="w-4 h-4" />Join Now
          </Link>
        )}
        {isCompleted && (
          <div className="h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 bg-zinc-800/50 border border-zinc-700/50 text-zinc-500 px-4 cursor-not-allowed select-none">
            <CheckCircle2 className="w-4 h-4" />Draw Closed
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ onClear, hasFilters, statusFilter }: { onClear: () => void; hasFilters: boolean; statusFilter: StatusFilter }) {
  const isCompletedTab = statusFilter === "completed";
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center mb-5 ${
        isCompletedTab ? "bg-zinc-500/10 border-zinc-500/20" : "bg-primary/10 border-primary/20"
      }`}>
        {isCompletedTab
          ? <CheckCircle2 className="w-10 h-10 text-zinc-500" />
          : <Trophy className="w-10 h-10 text-primary" />}
      </div>
      <h3 className="text-2xl font-bold font-heading text-white mb-2">
        {hasFilters
          ? "No draws match your filters"
          : isCompletedTab
            ? "No completed draws yet"
            : "No active draws right now"}
      </h3>
      <p className="text-zinc-400 text-sm max-w-sm mb-6">
        {hasFilters
          ? "Try adjusting or clearing your filters to see more draws."
          : isCompletedTab
            ? "Past draws will appear here once winners have been selected."
            : "New draws are added regularly — check back soon!"}
      </p>
      {hasFilters && (
        <Button onClick={onClear} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
          <X className="w-4 h-4 mr-2" />Clear all filters
        </Button>
      )}
    </div>
  );
}

function SecondaryCTA() {
  return (
    <section className="py-20 lg:py-28 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.08] blur-[120px]" />
      </div>
      <div className="container mx-auto px-6 relative z-10 text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">100% Transparent</span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold font-heading text-white mb-4">
          Every draw is <span className="text-primary">fair & verified</span>
        </h2>
        <p className="text-zinc-400 text-base mb-8">
          Our lucky draw system uses a provably fair random selection. Winners are announced publicly with full transparency.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/winners" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 transition-opacity">
            <Trophy className="w-4 h-4" />See Past Winners <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/15 text-white hover:border-white/30 font-semibold text-sm transition-colors">
            How It Works
          </Link>
        </div>
      </div>
    </section>
  );
}
