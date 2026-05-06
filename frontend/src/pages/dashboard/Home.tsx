import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Coins, Trophy, Users, Bell, TrendingUp, CheckCircle2, AlertCircle, XCircle, Loader2, Ticket } from "lucide-react";
import { Link } from "wouter";
import { userApi, type ApiStats } from "@/lib/api";
import { useAuth } from "@/contexts/useAuth";

function StatusIcon({ status }: { status: string }) {
  if (status === "approved" || status === "active" || status === "credited")
    return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === "pending")
    return <AlertCircle className="w-4 h-4 text-[#FFD700] shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.stats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name || user?.email || user?.phone || "there";

  const cards = [
    { label: "Total Tokens",    value: stats?.totalTokens ?? 0,          sub: "Available tokens",    icon: Coins,   color: "text-[#FFD700]",    bg: "bg-[#FFD700]/10" },
    { label: "Active Entries",  value: stats?.activeEntries ?? 0,        sub: "Draws you've joined", icon: Trophy,  color: "text-emerald-400",  bg: "bg-emerald-500/10" },
    { label: "Total Referrals", value: stats?.referralCount ?? 0,        sub: "Friends invited",     icon: Users,   color: "text-sky-400",       bg: "bg-sky-500/10" },
    { label: "Notifications",   value: stats?.unreadNotifications ?? 0,  sub: "Unread alerts",       icon: Bell,    color: "text-red-400",       bg: "bg-red-500/10" },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Welcome back, {displayName} 👋</h1>
          <p className="text-zinc-500 text-sm mt-1">Here's what's happening with your account today.</p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-[#111118] border border-white/8 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-white text-xs font-medium mt-0.5">{c.label}</div>
              <div className="text-zinc-500 text-[11px] mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FFD700]" />
                Recent Activity
              </h2>
              <Link href="/dashboard/transactions" className="text-[#FFD700] text-xs hover:underline">View all</Link>
            </div>
            {!stats?.recentActivity.length ? (
              <div className="py-10 text-center">
                <Ticket className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm font-medium">No activity yet</p>
                <p className="text-zinc-600 text-xs mt-1">Start by joining a draw to see your activity here</p>
                <Link href="/draws" className="inline-block mt-4 px-4 py-2 rounded-xl bg-[#FFD700]/15 text-[#FFD700] text-xs font-semibold border border-[#FFD700]/25 hover:bg-[#FFD700]/20 transition-colors">
                  Browse Live Draws →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <StatusIcon status={a.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium leading-snug">{a.text}</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/draws",                  label: "Browse Live Draws",    sub: "Join a draw with your tokens",     icon: Trophy,   color: "text-[#FFD700]"   },
                { href: "/dashboard/tokens",       label: "View My Tokens",       sub: `${stats?.totalTokens ?? 0} tokens available`,       icon: Coins,   color: "text-emerald-400" },
                { href: "/dashboard/referrals",    label: "Invite Friends",       sub: "Earn tokens for every referral",   icon: Users,   color: "text-sky-400"     },
                { href: "/dashboard/notifications",label: "Check Notifications",  sub: `${stats?.unreadNotifications ?? 0} unread`,           icon: Bell,    color: "text-red-400"     },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{a.label}</p>
                    <p className="text-zinc-500 text-xs">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
