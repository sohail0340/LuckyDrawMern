import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, LogOut, LayoutDashboard, Coins, CreditCard, Trophy,
  Users, Bell, UserCircle, CheckCircle2, Ticket,
  AlertCircle, XCircle, Clock, Filter, Copy, Share2, LinkIcon,
  CreditCard as PayCard, Info, Edit3, Save, X, Upload, Flame,
  Loader2, Receipt, Phone, MapPin, ChevronRight, BadgeCheck, Disc3,
} from "lucide-react";
import SpinWheel from "./SpinWheel";
import { useAuth } from "@/contexts/useAuth";
import {
  userApi,
  type ApiStats, type ApiTokensResponse, type ApiTransaction,
  type ApiDrawsResponse, type ApiReferralsResponse, type ApiNotification,
} from "@/lib/api";

/* ───────────────────── TYPES ───────────────────── */
type Section = "overview" | "tokens" | "transactions" | "draws" | "referrals" | "notifications" | "profile" | "spin";

const TABS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview",      label: "Overview",      icon: LayoutDashboard },
  { id: "spin",          label: "Daily Spin",    icon: Disc3 },
  { id: "tokens",        label: "Tokens",         icon: Coins },
  { id: "transactions",  label: "Transactions",   icon: CreditCard },
  { id: "draws",         label: "My Draws",       icon: Trophy },
  { id: "referrals",     label: "Referrals",      icon: Users },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "profile",       label: "Profile",        icon: UserCircle },
];

/* ───────────────────── STATUS HELPERS ───────────────────── */
const TXN_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: "Approved", color: "text-emerald-400", icon: CheckCircle2 },
  pending:  { label: "Pending",  color: "text-[#FFD700]",   icon: AlertCircle },
  rejected: { label: "Rejected", color: "text-red-400",     icon: XCircle },
};

const NOTIF_TYPE: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  payment: { label: "Payments", icon: PayCard,   color: "text-sky-400",     bg: "bg-sky-500/10" },
  win:     { label: "Wins",     icon: Trophy,    color: "text-[#FFD700]",   bg: "bg-[#FFD700]/10" },
  draw:    { label: "Draws",    icon: Ticket,    color: "text-emerald-400", bg: "bg-emerald-500/10" },
  system:  { label: "System",   icon: Info,      color: "text-zinc-400",    bg: "bg-white/5" },
};

/* ───────────────────── TINY HELPERS ───────────────────── */
function EmptyState({ icon: Icon, title, sub, action }: { icon: React.ElementType; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="py-16 text-center">
      <Icon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
      <p className="text-white font-semibold text-base">{title}</p>
      <p className="text-zinc-500 text-sm mt-1">{sub}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111118] border border-white/8 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-white text-2xl font-bold">{title}</h2>
      <p className="text-zinc-500 text-sm mt-1">{sub}</p>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div>;
}

/* ───────────────────── SECTION: OVERVIEW ───────────────────── */
function OverviewSection({ stats, loading, onNavigate }: {
  stats: ApiStats | null; loading: boolean; onNavigate: (s: Section) => void;
}) {
  function StatusIcon({ status }: { status: string }) {
    if (["approved", "active", "credited"].includes(status)) return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (status === "pending") return <AlertCircle className="w-4 h-4 text-[#FFD700] shrink-0" />;
    return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  }

  const cards = [
    { label: "Total Tokens",    value: stats?.totalTokens ?? 0,         sub: "Available tokens",     icon: Coins,   color: "text-[#FFD700]",    bg: "bg-[#FFD700]/10",    section: "tokens" as Section },
    { label: "Active Entries",  value: stats?.activeEntries ?? 0,       sub: "Draws you've joined",  icon: Trophy,  color: "text-emerald-400",  bg: "bg-emerald-500/10",  section: "draws" as Section },
    { label: "Total Referrals", value: stats?.referralCount ?? 0,       sub: "Friends invited",      icon: Users,   color: "text-sky-400",      bg: "bg-sky-500/10",      section: "referrals" as Section },
    { label: "Notifications",   value: stats?.unreadNotifications ?? 0, sub: "Unread alerts",        icon: Bell,    color: "text-red-400",      bg: "bg-red-500/10",      section: "notifications" as Section },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onNavigate(c.section)}
            className="bg-[#111118] border border-white/8 rounded-2xl p-4 text-left hover:border-white/20 transition-all group">
            <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-white text-xs font-medium mt-0.5">{c.label}</div>
            <div className="text-zinc-500 text-[11px] mt-0.5">{c.sub}</div>
          </button>
        ))}
      </div>

    </div>
  );
}

/* ───────────────────── SECTION: TOKENS ───────────────────── */
function TokensSection({ data, loading }: { data: ApiTokensResponse | null; loading: boolean }) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "used">("all");
  const [drawFilter, setDrawFilter] = useState("All Draws");

  if (loading) return <Spinner />;

  const tokens = data?.tokens ?? [];
  const activeCount = tokens.filter((t) => t.status === "active").length;
  const usedCount = tokens.filter((t) => t.status === "used").length;
  const draws = ["All Draws", ...Array.from(new Set(tokens.map((t) => t.draw)))];
  const filtered = tokens.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchDraw = drawFilter === "All Draws" || t.draw === drawFilter;
    return matchStatus && matchDraw;
  });

  return (
    <div className="space-y-6">
      <SectionTitle title="My Tokens" sub="Manage and track all your draw tokens." />
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Tokens", value: data?.totalTokens ?? 0, color: "text-white" },
          { label: "Active",       value: activeCount,             color: "text-emerald-400" },
          { label: "Used",         value: usedCount,               color: "text-zinc-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <Coins className="w-5 h-5 text-[#FFD700] mx-auto mb-2" />
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>
      {tokens.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState icon={Ticket} title="You don't have any tokens yet" sub="Join a draw to get your first token"
            action={<Link href="/draws" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black font-bold text-sm hover:opacity-90 transition-opacity">Browse Live Draws</Link>} />
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="flex gap-2">
                {(["all", "active", "used"] as const).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30" : "text-zinc-400 hover:text-white border border-transparent"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <select value={drawFilter} onChange={(e) => setDrawFilter(e.target.value)}
                className="bg-[#0a0a0f] border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#FFD700]/40">
                {draws.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/8 text-zinc-500 text-xs font-medium uppercase tracking-wider">
              <span>Token ID</span><span>Draw</span><span className="hidden sm:block">Purchased</span><span>Status</span>
            </div>
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">No tokens match your filters.</div>
            ) : filtered.map((t) => (
              <div key={t.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors items-center">
                <span className="text-[#FFD700] font-mono text-xs font-semibold">{t.id}</span>
                <div><p className="text-white text-sm font-medium">{t.draw}</p><p className="text-zinc-500 text-xs">{t.price}</p></div>
                <span className="text-zinc-400 text-xs hidden sm:block">{t.purchased}</span>
                <span className={`flex items-center gap-1 text-xs font-semibold ${t.status === "active" ? "text-emerald-400" : "text-zinc-500"}`}>
                  {t.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span className="capitalize hidden sm:inline">{t.status}</span>
                </span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

/* ───────────────────── SECTION: TRANSACTIONS ───────────────────── */
function TransactionsSection({ txns, loading }: { txns: ApiTransaction[]; loading: boolean }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  if (loading) return <Spinner />;

  const filtered = filter === "all" ? txns : txns.filter((t) => t.status === filter);
  const approvedTotal = txns.filter((t) => t.status === "approved")
    .reduce((s, t) => s + parseInt(t.amount.replace(/[^\d]/g, "")), 0);

  return (
    <div className="space-y-6">
      <SectionTitle title="My Transactions" sub="Track all your payment history and proof submissions." />
      {txns.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState icon={Receipt} title="No transactions yet" sub="Your payment history will appear here once you join a draw" />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(["all", "approved", "pending", "rejected"] as const).map((s) => {
              const count = s === "all" ? txns.length : txns.filter((t) => t.status === s).length;
              const colors: Record<string, string> = { all: "text-white", approved: "text-emerald-400", pending: "text-[#FFD700]", rejected: "text-red-400" };
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`bg-[#111118] border rounded-2xl p-4 text-center transition-all ${filter === s ? "border-[#FFD700]/30" : "border-white/8 hover:border-white/15"}`}>
                  <PayCard className={`w-5 h-5 mx-auto mb-2 ${colors[s]}`} />
                  <div className={`text-2xl font-bold ${colors[s]}`}>{count}</div>
                  <div className="text-zinc-500 text-xs mt-0.5 capitalize">{s === "all" ? "Total" : s}</div>
                </button>
              );
            })}
          </div>
            <Card className="px-5 py-3 flex items-center justify-between border-[#FFD700]/20">
              <span className="text-zinc-400 text-sm">Total Amount Paid (Approved)</span>
              <span className="text-[#FFD700] font-bold text-lg">Rs. {(approvedTotal ?? 0).toLocaleString()}</span>
            </Card>
          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-sm">No {filter} transactions found.</div>
            ) : filtered.map((t) => {
              const S = TXN_STATUS[t.status] || TXN_STATUS.pending;
              return (
                <div key={t.id} className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-3 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors items-start sm:items-center">
                  <span className="text-zinc-400 font-mono text-xs">{t.id}</span>
                  <div><p className="text-white text-sm font-medium">{t.draw}</p><p className="text-zinc-500 text-xs">{t.tokens} token{t.tokens > 1 ? "s" : ""}</p></div>
                  <span className="text-white text-sm font-semibold">{t.amount}</span>
                  <span className="text-zinc-400 text-xs">{t.method}</span>
                  <span className="text-zinc-500 text-xs">{t.date}</span>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${S.color}`}>
                      <S.icon className="w-3.5 h-3.5" />{S.label}
                    </span>
                    {t.status === "rejected" && (
                      <button className="flex items-center gap-1 text-[10px] text-[#FFD700] border border-[#FFD700]/30 rounded-lg px-2 py-0.5 hover:bg-[#FFD700]/10 transition-colors">
                        <Upload className="w-3 h-3" />Re-upload
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}

/* ───────────────────── SECTION: MY DRAWS ───────────────────── */
function DrawsSection({ data, loading }: { data: ApiDrawsResponse | null; loading: boolean }) {
  const [tab, setTab] = useState<"active" | "past">("active");

  if (loading) return <Spinner />;

  const activeDraws = data?.activeDraws ?? [];
  const pastDraws = data?.pastDraws ?? [];

  return (
    <div className="space-y-6">
      <SectionTitle title="My Draws" sub="View your draw entries and results." />
      <div className="flex bg-[#111118] border border-white/8 rounded-2xl p-1 w-fit">
        {(["active", "past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? "bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black" : "text-zinc-400 hover:text-white"}`}>
            {t === "active" ? `Active (${activeDraws.length})` : `Past (${pastDraws.length})`}
          </button>
        ))}
      </div>

      {tab === "active" && (activeDraws.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState icon={Trophy} title="You have not joined any draws yet" sub="Browse live draws and enter to win big prizes"
            action={<Link href="/draws" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black font-bold text-sm hover:opacity-90 transition-opacity">Browse Live Draws</Link>} />
        </Card>
      ) : (
        <div className="space-y-4">
          {activeDraws.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-red-400" /><span className="text-white font-semibold">{d.name}</span></div>
                  {d.prize && <p className="text-[#FFD700] text-sm font-medium mt-1">{d.prize}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-white font-bold text-lg">{d.tokens}</div>
                  <div className="text-zinc-500 text-xs">tokens entered</div>
                </div>
              </div>
              <p className="text-zinc-500 text-xs mt-3">
                Joined {new Date(d.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </Card>
          ))}
        </div>
      ))}

      {tab === "past" && (pastDraws.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState icon={Trophy} title="No past draws yet" sub="Completed draws will appear here" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {pastDraws.map((d) => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{d.name}</p>
                <p className="text-zinc-500 text-xs">{d.tokens}x tokens · {d.date}</p>
              </div>
              {d.result === "won" ? (
                <div className="text-right">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Won!</span>
                  {d.prize && <span className="text-[#FFD700] text-[10px] font-semibold">{d.prize}</span>}
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-zinc-500"><XCircle className="w-3.5 h-3.5" />Not won</span>
              )}
            </div>
          ))}
        </Card>
      ))}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Draws",   value: activeDraws.length + pastDraws.length },
          { label: "Draws Won",     value: pastDraws.filter((d) => d.result === "won").length, gold: true },
          { label: "Total Entries", value: [...activeDraws, ...pastDraws].reduce((s, d) => s + d.tokens, 0) },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <Trophy className={`w-5 h-5 mx-auto mb-2 ${s.gold ? "text-[#FFD700]" : "text-zinc-400"}`} />
            <div className={`text-2xl font-bold ${s.gold ? "text-[#FFD700]" : "text-white"}`}>{s.value}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────── SECTION: REFERRALS ───────────────────── */
function ReferralsSection({ data, loading }: { data: ApiReferralsResponse | null; loading: boolean }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  if (loading) return <Spinner />;

  const refCode = data?.referralCode ?? "";
  const refUrl = refCode ? `${window.location.origin}/auth?tab=signup&ref=${refCode}` : "";

  function copy(value: string, type: "code" | "link") {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Referral Dashboard" sub="Share your code and earn 1 token when a referred user makes their first approved purchase." />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Referrals", value: data?.totalReferrals ?? 0, icon: Users,  color: "text-sky-400",    bg: "bg-sky-500/10" },
          { label: "Tokens Earned",   value: data?.earnedTokens ?? 0,   icon: Coins,  color: "text-[#FFD700]",  bg: "bg-[#FFD700]/10" },
          { label: "Pending Rewards", value: Math.max(0, (data?.totalReferrals ?? 0) - (data?.earnedTokens ?? 0)), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-4 border-[#FFD700]/20">
        <h3 className="text-white font-semibold text-sm">Your Referral Code</h3>
        {!refCode && <div className="text-amber-400 text-sm">To get your referral link, you have to buy at least 100 tokens.</div>}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px] bg-[#0a0a0f] border border-[#FFD700]/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-[#FFD700] font-bold font-mono text-lg tracking-widest">{refCode || "—"}</span>
            {refCode && (
              <button onClick={() => copy(refCode, "code")} className="flex items-center gap-1.5 text-zinc-400 hover:text-[#FFD700] transition-colors text-xs font-medium">
                {copied === "code" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied === "code" ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {refCode && (
            <>
              <button onClick={() => copy(refUrl, "link")} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                <LinkIcon className="w-4 h-4 text-zinc-400" />
                {copied === "link" ? "Copied!" : "Copy Link"}
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black text-sm font-bold hover:opacity-90 transition-opacity">
                <Share2 className="w-4 h-4" />Share
              </button>
            </>
          )}
        </div>
        <p className="text-zinc-500 text-xs leading-relaxed border-t border-white/5 pt-3">
          You earn <span className="text-[#FFD700] font-semibold">1 token</span> when the referred user makes their first approved token purchase.
        </p>
      </Card>

      {refUrl && (
        <div className="bg-[#0a0a0f] border border-white/8 rounded-xl px-4 py-3 flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-500 text-xs truncate">{refUrl}</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-white font-semibold text-sm">Referral Activity</h3>
          <span className="text-zinc-500 text-xs">{data?.totalReferrals ?? 0} referrals</span>
        </div>
        {!data?.referrals.length ? (
          <EmptyState icon={Users} title="No referrals yet" sub="Invite friends to earn 1 token on their first approved purchase" />
        ) : data.referrals.map((r, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs shrink-0">
              {r.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{r.name}</p>
              <p className="text-zinc-500 text-xs">Joined {r.joined}</p>
            </div>
            {r.rewardGiven && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />+1 token
              </span>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ───────────────────── SECTION: NOTIFICATIONS ───────────────────── */
function NotificationsSection({ notifs: initial, loading, onNotifUpdate }: { notifs: ApiNotification[]; loading: boolean; onNotifUpdate?: (updatedNotifs: ApiNotification[]) => void }) {
  const [notifs, setNotifs] = useState<ApiNotification[]>(initial);
  const [filter, setFilter] = useState<"all" | "payment" | "win" | "draw" | "system">("all");

  useEffect(() => { setNotifs(initial); }, [initial]);

  if (loading) return <Spinner />;

  const unread = notifs.filter((n) => !n.read).length;
  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.type === filter);

  async function markRead(id: number) {
    await userApi.markNotificationRead(id).catch(() => null);
    setNotifs((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      onNotifUpdate?.(updated);
      return updated;
    });
  }

  async function markAllRead() {
    await userApi.markAllRead().catch(() => null);
    setNotifs((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      onNotifUpdate?.(updated);
      return updated;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            Notifications
            {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{unread}</span>}
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Stay updated with draws, payments, and wins.</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-[#FFD700] text-xs font-semibold hover:underline shrink-0">Mark all as read</button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "payment", "win", "draw", "system"] as const).map((f) => {
          const count = f === "all" ? notifs.length : notifs.filter((n) => n.type === f).length;
          const cfg = f !== "all" ? NOTIF_TYPE[f] : null;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30" : "text-zinc-400 border border-white/8 hover:text-white"}`}>
              {cfg && <cfg.icon className="w-3 h-3" />}
              <span className="capitalize">{f === "all" ? "All" : cfg?.label ?? f}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {notifs.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" sub="You'll be notified about payments, draw results, and wins" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="Nothing here" sub="No notifications in this category." />
        ) : filtered.map((n) => {
          const cfg = NOTIF_TYPE[n.type] ?? NOTIF_TYPE.system;
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 transition-colors cursor-pointer ${!n.read ? "bg-[#FFD700]/3 hover:bg-[#FFD700]/5" : "hover:bg-white/3"}`}>
              <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 ${n.read ? "opacity-60" : ""}`}>
                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${n.read ? "text-zinc-300" : "text-white"}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#FFD700] shrink-0" />}
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">{n.message}</p>
              </div>
              <span className="text-zinc-600 text-xs shrink-0 mt-0.5">{n.time}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ───────────────────── SECTION: PROFILE ───────────────────── */
function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: user?.name ?? "", city: user?.city ?? "",
    address: user?.address ?? "", province: user?.province ?? "", cnic: user?.cnic ?? "",
  });

  async function save() {
    setSaving(true); setError("");
    try { await userApi.updateProfile(draft); await refreshUser(); setEditing(false); }
    catch (err: unknown) { setError((err as Error).message || "Failed to save profile"); }
    finally { setSaving(false); }
  }

  function cancel() {
    setDraft({ name: user?.name ?? "", city: user?.city ?? "", address: user?.address ?? "", province: user?.province ?? "", cnic: user?.cnic ?? "" });
    setEditing(false); setError("");
  }

  const inputClass = "bg-[#0a0a0f] border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-[#FFD700]/40 focus:outline-none w-full disabled:opacity-50 disabled:cursor-not-allowed";
  const displayName = user?.name || user?.email || user?.phone || "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  function Field({ label, field, type = "text" }: { label: string; field: keyof typeof draft; type?: string }) {
    return (
      <div className="space-y-1.5">
        <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide">{label}</label>
        <input type={type} disabled={!editing} value={draft[field]}
          onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
          className={inputClass} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <SectionTitle title="Profile" sub="Manage your personal information." />
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FFD700]/30 text-[#FFD700] text-sm font-semibold hover:bg-[#FFD700]/10 transition-colors shrink-0">
            <Edit3 className="w-4 h-4" />Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <button onClick={cancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm font-semibold hover:text-white transition-colors">
              <X className="w-4 h-4" />Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black text-sm font-bold hover:opacity-90 transition-opacity">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <Card className="p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-2xl shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{displayName}</p>
          <p className="text-zinc-500 text-sm">{user?.email || user?.phone || ""}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">Verified Account</span>
            </div>
            <div className="text-zinc-600 text-xs">Referral: <span className="text-[#FFD700] font-mono font-semibold">{user?.referralCode}</span></div>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><UserCircle className="w-4 h-4 text-[#FFD700]" /><h3 className="text-white font-semibold text-sm">Personal Information</h3></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name" field="name" />
          <Field label="CNIC" field="cnic" />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><Phone className="w-4 h-4 text-[#FFD700]" /><h3 className="text-white font-semibold text-sm">Contact Details</h3></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Email</label>
            <input type="email" disabled value={user?.email ?? "—"} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Phone</label>
            <input type="tel" disabled value={user?.phone ?? "—"} className={inputClass} />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-[#FFD700]" /><h3 className="text-white font-semibold text-sm">Address</h3></div>
        <Field label="Street Address" field="address" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="City" field="city" />
          <Field label="Province" field="province" />
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────── MAIN DASHBOARD ───────────────────── */
export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [activeSection, setActiveSection] = useState<Section>(() => {
    return (localStorage.getItem("cld_dash_tab") as Section) || "overview";
  });

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Persist tab
  const goTo = useCallback((s: Section) => {
    setActiveSection(s);
    localStorage.setItem("cld_dash_tab", s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Data loading state
  const [statsLoading, setStatsLoading] = useState(true);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [drawsLoading, setDrawsLoading] = useState(true);
  const [refsLoading, setRefsLoading] = useState(true);
  const [notifsLoading, setNotifsLoading] = useState(true);

  const [stats, setStats] = useState<ApiStats | null>(null);
  const [tokensData, setTokensData] = useState<ApiTokensResponse | null>(null);
  const [txns, setTxns] = useState<ApiTransaction[]>([]);
  const [drawsData, setDrawsData] = useState<ApiDrawsResponse | null>(null);
  const [refsData, setRefsData] = useState<ApiReferralsResponse | null>(null);
  const [notifs, setNotifs] = useState<ApiNotification[]>([]);

  const handleSpinTokenUpdate = useCallback((newTotal: number) => {
    setStats((prev) => prev ? { ...prev, totalTokens: newTotal } : prev);
    setTokensData((prev) => prev ? { ...prev, totalTokens: newTotal } : prev);
  }, []);

  useEffect(() => {
    if (!user) return;
    userApi.stats().then(setStats).catch(console.error).finally(() => setStatsLoading(false));
    userApi.tokens().then(setTokensData).catch(console.error).finally(() => setTokensLoading(false));
    userApi.transactions().then(setTxns).catch(console.error).finally(() => setTxnsLoading(false));
    userApi.draws().then(setDrawsData).catch(console.error).finally(() => setDrawsLoading(false));
    userApi.referrals().then(setRefsData).catch(console.error).finally(() => setRefsLoading(false));
    userApi.notifications().then(setNotifs).catch(console.error).finally(() => setNotifsLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  const displayName = user.name || user.email || user.phone || "there";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-[#0d0d15]/90 backdrop-blur-md border-b border-white/8">
        <div className="container mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center p-[2px]">
              <div className="w-full h-full rounded-full bg-[#111118] flex items-center justify-center">
                <Crown className="w-4 h-4 text-[#FFD700]" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-white text-sm leading-none uppercase tracking-wide">Kaptan</span>
              <span className="font-semibold text-[#FFD700] text-[8px] tracking-[0.2em] leading-none mt-0.5 uppercase">Lucky Draw</span>
            </div>
          </Link>

          <div className="flex-1" />

          {/* Notification badge */}
          <button onClick={() => goTo("notifications")}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User pill */}
          <div className="flex items-center gap-2 bg-[#111118] border border-white/8 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFE680] via-[#FFD700] to-[#B8860B] flex items-center justify-center text-black font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold truncate max-w-[120px]">{displayName}</span>
              <span className="text-[#FFD700] text-[10px] font-mono">{user.tokens} tokens</span>
            </div>
          </div>

          <button onClick={logout} className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Welcome bar ── */}
      <div className="bg-[#0d0d15] border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <h1 className="text-white text-lg font-bold">Welcome back, {displayName} 👋</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Here's what's happening with your account today.</p>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="sticky top-14 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-2 -mb-px">
            {TABS.map((tab) => {
              const active = activeSection === tab.id;
              return (
                <button key={tab.id} onClick={() => goTo(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 relative ${
                    active
                      ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === "notifications" && unreadCount > 0 && (
                    <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeSection === "overview" && (
              <OverviewSection stats={stats} loading={statsLoading} onNavigate={goTo} />
            )}
            {activeSection === "tokens" && (
              <TokensSection data={tokensData} loading={tokensLoading} />
            )}
            {activeSection === "transactions" && (
              <TransactionsSection txns={txns} loading={txnsLoading} />
            )}
            {activeSection === "draws" && (
              <DrawsSection data={drawsData} loading={drawsLoading} />
            )}
            {activeSection === "referrals" && (
              <ReferralsSection data={refsData} loading={refsLoading} />
            )}
            {activeSection === "notifications" && (
              <NotificationsSection notifs={notifs} loading={notifsLoading} onNotifUpdate={setNotifs} />
            )}
            {activeSection === "spin" && <SpinWheel onTokensUpdated={handleSpinTokenUpdate} />}
            {activeSection === "profile" && <ProfileSection />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
