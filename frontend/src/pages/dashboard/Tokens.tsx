import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Coins, CheckCircle2, Clock, Filter, Loader2, Ticket, Hash } from "lucide-react";
import { Link } from "wouter";
import { userApi, type ApiTokensResponse } from "@/lib/api";

export default function Tokens() {
  const [data, setData] = useState<ApiTokensResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "used">("all");
  const [drawFilter, setDrawFilter] = useState("All Draws");

  useEffect(() => {
    userApi.tokens().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div></DashboardLayout>;

  const tokens = (data?.totalTokens ?? 0) > 0 && Array.isArray(data?.tokens) ? data!.tokens : [];
  const activeCount = tokens.filter((t) => t.status === "active").length;
  const usedCount = tokens.filter((t) => t.status === "used").length;
  const draws = ["All Draws", ...Array.from(new Set(tokens.map((t) => t.draw)))];

  const filtered = tokens.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchDraw = drawFilter === "All Draws" || t.draw === drawFilter;
    return matchStatus && matchDraw;
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">My Tokens</h1>
          <p className="text-zinc-500 text-sm mt-1">Each token is a unique entry into your draws.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Balance", value: data?.totalTokens ?? 0, color: "text-white", icon: <Coins className="w-5 h-5 text-[#FFD700] mx-auto mb-2" /> },
            { label: "Available",     value: data?.availableTokens ?? activeCount, color: "text-emerald-400", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" /> },
            { label: "Used in Draws", value: data?.usedTokens ?? usedCount,        color: "text-zinc-400",   icon: <Clock className="w-5 h-5 text-zinc-400 mx-auto mb-2" /> },
          ].map((s) => (
            <div key={s.label} className="bg-[#111118] border border-white/8 rounded-2xl p-4 text-center">
              {s.icon}
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-zinc-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {tokens.length === 0 ? (
          <div className="bg-[#111118] border border-white/8 rounded-2xl py-16 text-center">
            <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-white font-semibold text-base">You don't have any tokens yet</p>
            <p className="text-zinc-500 text-sm mt-1 mb-5">Purchase tokens to get started</p>
            <Link href="/draws" className="inline-block px-5 py-2.5 rounded-xl bg-linear-to-b from-[#FFE680] via-[#FFD700] to-[#B8860B] text-black font-bold text-sm hover:opacity-90 transition-opacity">
              Browse Live Draws
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex gap-2">
                  {(["all", "active", "used"] as const).map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30" : "text-zinc-400 hover:text-white border border-transparent"}`}
                    >{s === "active" ? "Available" : s === "used" ? "Used" : "All"}</button>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <select value={drawFilter} onChange={(e) => setDrawFilter(e.target.value)}
                  className="bg-[#0a0a0f] border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#FFD700]/40">
                  {draws.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/8 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                <span>Token #</span><span>Draw / Status</span><span className="hidden sm:block">Issued</span><span>State</span>
              </div>
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-sm">No tokens match your filters.</div>
              ) : (
                filtered.map((t) => (
                  <div key={t.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors items-center">
                    <div className="flex items-center gap-1.5 min-w-20">
                      <Hash className="w-3 h-3 text-[#FFD700]/60 shrink-0" />
                      <span className="text-[#FFD700] font-mono text-sm font-bold">
                        {t.tokenNumber ?? t.id}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{t.draw}</p>
                      <p className="text-zinc-500 text-xs">{t.price}</p>
                    </div>
                    <span className="text-zinc-400 text-xs hidden sm:block">{t.purchased}</span>
                    <span className={`flex items-center gap-1 text-xs font-semibold ${t.status === "active" ? "text-emerald-400" : "text-zinc-500"}`}>
                      {t.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span className="capitalize hidden sm:inline">{t.status === "active" ? "Available" : "Used"}</span>
                    </span>
                  </div>
                ))
              )}
            </div>

            <p className="text-zinc-600 text-xs text-center">
              Each token number is your unique draw entry. The winner is picked by random token selection.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
