import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi, type AdminStats, type AdminAnalytics } from "@/lib/api";
import { Users, Trophy, Ticket, Clock, Wallet, Zap, TrendingUp, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmt(n: number) { return n.toLocaleString("en-PK"); }
function fmtPkr(n: number) { return `Rs. ${n.toLocaleString("en-PK")}`; }
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.analytics()])
      .then(([s, a]) => { setStats(s); setAnalytics(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Total Users", value: fmt(stats.totalUsers), sub: `+${stats.newUsersToday} today`, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10", border: "" },
    { label: "Active Draws", value: fmt(stats.activeDraws), sub: "currently running", icon: Trophy, color: "text-[#FFD700]", bg: "bg-[#FFD700]/10", border: "border-[#FFD700]/20" },
    { label: "Tokens Sold Today", value: fmt(stats.tokensSoldToday), sub: "approved", icon: Ticket, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "" },
    { label: "Pending Payments", value: fmt(stats.pendingPayments), sub: "awaiting review", icon: Clock, color: stats.pendingPayments > 0 ? "text-red-400" : "text-zinc-400", bg: stats.pendingPayments > 0 ? "bg-red-500/10" : "bg-white/5", border: stats.pendingPayments > 0 ? "border-red-500/30" : "", onClick: () => navigate("/admin/payments") },
    { label: "Total Revenue", value: fmtPkr(stats.totalRevenuePkr), sub: "all time", icon: Wallet, color: "text-purple-400", bg: "bg-purple-500/10", border: "" },
    { label: "Daily Spins Today", value: fmt(stats.totalSpinsToday), sub: "spins used", icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10", border: "" },
  ] : [];

  const revenueData = analytics?.revenue.dailyLast30.map(d => ({
    day: new Date(d.date).getDate().toString(),
    revenue: Number(d.total),
  })) ?? [];

  const tokensData = analytics?.draws.topDraws.map(d => ({
    draw: d.drawName.length > 12 ? d.drawName.slice(0, 12) + "…" : d.drawName,
    tokens: Number(d.totalTokens),
  })) ?? [];

  function statusDot(s: string) {
    if (s === "approved" || s === "won") return "bg-emerald-500";
    if (s === "pending") return "bg-yellow-500";
    if (s === "rejected") return "bg-red-500";
    return "bg-zinc-500";
  }

  return (
    <AdminLayout title="Overview">
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((s) => (
              <div key={s.label} onClick={s.onClick} className={`bg-[#111118] border ${s.border || "border-white/8"} rounded-2xl p-4 ${s.onClick ? "cursor-pointer hover:bg-[#1a1a24] transition-colors" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  {s.onClick && <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />}
                </div>
                <div className={`text-2xl font-bold mt-3 ${s.color}`}>{s.value}</div>
                <div className="text-white text-sm font-medium mt-0.5">{s.label}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Daily Revenue (PKR) — Last 30 Days</h3>
              {revenueData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-zinc-500 text-sm">No revenue data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : String(v)} />
                    <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff20", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Top Draws by Tokens Sold</h3>
              {tokensData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-zinc-500 text-sm">No draw data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={tokensData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="draw" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#111118", border: "1px solid #ffffff20", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Bar dataKey="tokens" fill="#FFD700" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
            </div>
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
              {(stats?.recentActivity || []).length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-sm">No activity yet</div>
              ) : (
                (stats?.recentActivity || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(a.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{a.text}</p>
                    </div>
                    <span className="text-zinc-500 text-xs shrink-0">{timeAgo(a.time)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
